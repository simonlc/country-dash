import {
  geoToSpherePosition,
  getTerminatorHalfAngleRadians,
  getCountryHighlightRings,
  getRotatedSunDirection,
  useGlobeInteraction,
  type GlobeViewProps,
} from './globeShared';
import {
  geoCircle,
  geoEquirectangular,
  geoGraticule10,
  geoOrthographic,
  geoPath,
  geoRotation,
  type GeoPermissibleObjects,
} from 'd3';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppThemeId, GlobePalette } from '@/app/theme';
import type {
  CountryFeature,
  FeatureCollectionLike,
  GameMode,
} from '@/features/game/types';

interface WebGlGlobeProps extends GlobeViewProps {
  palette: GlobePalette;
  themeId: AppThemeId;
}

interface SphereMesh {
  indices: Uint16Array;
  positions: Float32Array;
  sourceCoordinates: Float32Array;
  uvs: Float32Array;
}

interface WebGlResources {
  gl: WebGLRenderingContext;
  indexCount: number;
  lastRotation: [number, number] | null;
  mesh: SphereMesh;
  overlayPositionBuffer: WebGLBuffer;
  overlayPositions: Float32Array;
  overlayTexture: WebGLTexture;
  positionBuffer: WebGLBuffer;
  program: WebGLProgram;
  texture: WebGLTexture;
  uniforms: {
    atmosphereOpacity: WebGLUniformLocation;
    atmosphereTint: WebGLUniformLocation;
    auroraStrength: WebGLUniformLocation;
    gridColor: WebGLUniformLocation;
    gridStrength: WebGLUniformLocation;
    nightAlpha: WebGLUniformLocation;
    nightColor: WebGLUniformLocation;
    noiseStrength: WebGLUniformLocation;
    penumbra: WebGLUniformLocation;
    rimLightColor: WebGLUniformLocation;
    rimLightStrength: WebGLUniformLocation;
    scale: WebGLUniformLocation;
    scanlineDensity: WebGLUniformLocation;
    scanlineStrength: WebGLUniformLocation;
    specularColor: WebGLUniformLocation;
    specularPower: WebGLUniformLocation;
    specularStrength: WebGLUniformLocation;
    sunDirection: WebGLUniformLocation;
    texture: WebGLUniformLocation;
    time: WebGLUniformLocation;
  };
}

const ambientAnimationFps = 12;
const selectedOverlayInsetPx = 0.35;

const vertexShaderSource = `
  attribute vec3 a_position;
  attribute vec2 a_uv;

  uniform vec2 u_scale;

  varying vec2 v_uv;
  varying vec3 v_normal;

  void main() {
    gl_Position = vec4(a_position.x * u_scale.x, a_position.y * u_scale.y, a_position.z * 0.5, 1.0);
    v_uv = a_uv;
    v_normal = a_position;
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform vec3 u_atmosphereTint;
  uniform vec3 u_gridColor;
  uniform vec3 u_rimLightColor;
  uniform vec3 u_specularColor;
  uniform float u_atmosphereOpacity;
  uniform float u_auroraStrength;
  uniform float u_gridStrength;
  uniform float u_nightAlpha;
  uniform float u_noiseStrength;
  uniform vec3 u_nightColor;
  uniform sampler2D u_texture;
  uniform float u_penumbra;
  uniform float u_rimLightStrength;
  uniform float u_scanlineDensity;
  uniform float u_scanlineStrength;
  uniform float u_specularPower;
  uniform float u_specularStrength;
  uniform vec3 u_sunDirection;
  uniform float u_time;

  varying vec2 v_uv;
  varying vec3 v_normal;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec4 baseColor = texture2D(u_texture, v_uv);
    vec3 normal = normalize(v_normal);
    vec3 sunDirection = normalize(u_sunDirection);
    float light = dot(normal, sunDirection);
    float twilight = smoothstep(u_penumbra, -u_penumbra, light) * u_nightAlpha;
    vec3 shaded = mix(baseColor.rgb, u_nightColor, clamp(twilight, 0.0, 1.0));
    float daylight = clamp(light * 0.5 + 0.5, 0.0, 1.0);
    float directLight = clamp(light, 0.0, 1.0);

    float facing = clamp(normal.z, 0.0, 1.0);
    float rim = pow(1.0 - facing, 2.5) * u_rimLightStrength * (0.22 + daylight * 0.48);
    float specular = pow(
      max(dot(reflect(-sunDirection, normal), vec3(0.0, 0.0, 1.0)), 0.0),
      u_specularPower
    ) * u_specularStrength * directLight;

    float lonLine = 1.0 - smoothstep(0.02, 0.055, abs(fract(v_uv.x * 24.0 + u_time * 0.015) - 0.5));
    float latLine = 1.0 - smoothstep(0.02, 0.06, abs(fract(v_uv.y * 12.0) - 0.5));
    float grid = max(lonLine, latLine) * u_gridStrength * facing * directLight;

    float scanlineWave = sin(v_uv.y * u_scanlineDensity + u_time * 5.0 + v_uv.x * 12.0);
    float scanline = (0.5 + 0.5 * scanlineWave) * u_scanlineStrength * daylight;

    float auroraWave = sin(v_uv.y * 18.0 - u_time * 0.9 + normal.x * 3.5);
    float aurora = smoothstep(0.15, 1.0, auroraWave) * u_auroraStrength * rim * daylight;

    float grain = (hash(v_uv * vec2(1024.0, 512.0) + u_time) - 0.5) * u_noiseStrength;
    float atmosphere = u_atmosphereOpacity * (0.03 + directLight * 0.2 + rim * 0.18);

    vec3 color = shaded;
    color += u_atmosphereTint * atmosphere;
    color += u_gridColor * (grid + scanline * 0.12);
    color += u_rimLightColor * (rim + aurora);
    color += u_specularColor * specular;
    color += grain;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), baseColor.a);
  }
`;

function cssColorToVec3(color: string): [number, number, number] {
  const { rgb } = parseCssColor(color);
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create WebGL shader.');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message =
      gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const program = gl.createProgram();
  if (!program) {
    throw new Error('Failed to create WebGL program.');
  }

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource,
  );

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message =
      gl.getProgramInfoLog(program) ?? 'Unknown program link error.';
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

function createSphereMesh(
  latitudeBands = 96,
  longitudeBands = 192,
): SphereMesh {
  const positions: number[] = [];
  const sourceCoordinates: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let lat = 0; lat <= latitudeBands; lat += 1) {
    const v = lat / latitudeBands;
    const latitude = Math.PI * (0.5 - v);

    for (let lon = 0; lon <= longitudeBands; lon += 1) {
      const u = lon / longitudeBands;
      const longitude = (u - 0.5) * Math.PI * 2;
      const longitudeDegrees = (longitude * 180) / Math.PI;
      const latitudeDegrees = (latitude * 180) / Math.PI;
      const position = geoToSpherePosition(longitudeDegrees, latitudeDegrees);

      positions.push(position.x, position.y, position.z);
      sourceCoordinates.push(longitudeDegrees, latitudeDegrees);
      uvs.push(u, v);
    }
  }

  for (let lat = 0; lat < latitudeBands; lat += 1) {
    for (let lon = 0; lon < longitudeBands; lon += 1) {
      const first = lat * (longitudeBands + 1) + lon;
      const second = first + longitudeBands + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return {
    indices: new Uint16Array(indices),
    positions: new Float32Array(positions),
    sourceCoordinates: new Float32Array(sourceCoordinates),
    uvs: new Float32Array(uvs),
  };
}

function parseCssColor(color: string) {
  const rgbaMatch = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i,
  );
  if (rgbaMatch) {
    return {
      alpha: rgbaMatch[4] ? Number(rgbaMatch[4]) : 1,
      rgb: [
        Number(rgbaMatch[1]),
        Number(rgbaMatch[2]),
        Number(rgbaMatch[3]),
      ] as [number, number, number],
    };
  }

  const hex = color.replace('#', '');
  const fullHex =
    hex.length === 3
      ? hex
          .split('')
          .map((value) => value + value)
          .join('')
      : hex;

  return {
    alpha: 1,
    rgb: [
      parseInt(fullHex.slice(0, 2), 16),
      parseInt(fullHex.slice(2, 4), 16),
      parseInt(fullHex.slice(4, 6), 16),
    ] as [number, number, number],
  };
}

function drawFeatureCollection(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  fillStyle: string,
  strokeStyle: string,
  lineWidth: number,
) {
  context.fillStyle = fillStyle;
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;

  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.fill();
    context.stroke();
  }
}

function applyCountryDeboss(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  palette: GlobePalette,
) {
  if (palette.countryDebossStrength <= 0) {
    return;
  }

  for (const feature of world.features) {
    context.save();
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.clip();

    context.globalAlpha = palette.countryDebossStrength;
    context.lineJoin = 'round';
    context.lineWidth = palette.countryDebossWidth;

    context.translate(
      -palette.countryDebossOffset,
      -palette.countryDebossOffset,
    );
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.strokeStyle = palette.countryDebossLight;
    context.stroke();

    context.translate(
      -palette.countryDebossOffset * 2,
      -palette.countryDebossOffset * 2,
    );
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.strokeStyle = palette.countryDebossDark;
    context.stroke();

    context.restore();
  }
}

function applyCountryShadow(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  palette: GlobePalette,
) {
  if (palette.countryShadowBlur <= 0) {
    return;
  }

  const isRaisedShadow = palette.countryElevation > 0;
  const steps = isRaisedShadow
    ? Math.max(14, Math.min(56, Math.round(palette.countryShadowBlur * 1.2)))
    : 1;
  const baseAlpha = parseCssColor(palette.countryShadowColor).alpha;
  const shadowRgb = parseCssColor(palette.countryShadowColor).rgb;
  const blurSpread = Math.max(palette.countryShadowBlur * 0.14, 1.2);
  const baseOffsetX = isRaisedShadow ? 0 : palette.countryShadowOffsetX;
  const baseOffsetY = isRaisedShadow ? 0 : palette.countryShadowOffsetY;

  context.save();
  context.fillStyle = `rgba(${shadowRgb[0]}, ${shadowRgb[1]}, ${shadowRgb[2]}, ${baseAlpha})`;

  for (let step = 0; step < steps; step += 1) {
    const progress = (step + 1) / steps;
    const angle = (step / steps) * Math.PI * 2;
    const radialDistance = isRaisedShadow
      ? Math.sqrt(progress) * blurSpread
      : 0;
    const alphaScale = isRaisedShadow
      ? Math.pow(1 - step / steps, 1.45) * 0.09
      : 1;
    const offsetX = baseOffsetX + Math.cos(angle) * radialDistance;
    const offsetY = baseOffsetY + Math.sin(angle) * radialDistance;

    context.save();
    context.translate(offsetX, offsetY);
    context.globalAlpha = alphaScale;

    for (const feature of world.features) {
      context.beginPath();
      path(feature as GeoPermissibleObjects);
      context.fill();
    }

    context.restore();
  }

  context.restore();
}

function withTextureContext(
  canvas: HTMLCanvasElement,
  draw: (context: CanvasRenderingContext2D) => void,
) {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to create globe texture context.');
  }

  draw(context);
}

function applyAtlasPaperTexture(
  context: CanvasRenderingContext2D,
  textureCanvas: HTMLCanvasElement,
  atlasPaperImage: HTMLImageElement | null,
) {
  if (!atlasPaperImage) {
    return;
  }

  context.save();
  context.globalAlpha = 0.3;
  context.globalCompositeOperation = 'multiply';
  context.drawImage(
    atlasPaperImage,
    0,
    0,
    textureCanvas.width,
    textureCanvas.height,
  );
  context.globalAlpha = 0.16;
  context.globalCompositeOperation = 'soft-light';
  context.drawImage(
    atlasPaperImage,
    0,
    0,
    textureCanvas.width,
    textureCanvas.height,
  );
  context.restore();
}

function buildOceanTextureCanvas(
  world: FeatureCollectionLike,
  palette: GlobePalette,
  textureSize: number,
  _isAtlas: boolean,
  atlasPaperImage: HTMLImageElement | null,
) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = textureSize;
  textureCanvas.height = textureSize / 2;

  withTextureContext(textureCanvas, (context) => {
    context.fillStyle = palette.oceanFill;
    context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
    applyAtlasPaperTexture(context, textureCanvas, atlasPaperImage);

    if (palette.countryElevation > 0) {
      const projection = geoEquirectangular()
        .translate([textureCanvas.width / 2, textureCanvas.height / 2])
        .scale(textureCanvas.width / (2 * Math.PI));
      const path = geoPath(projection, context);
      applyCountryShadow(context, path, world, palette);
    }
  });

  return textureCanvas;
}

function drawAtlasExpeditionDetails(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  textureCanvas: HTMLCanvasElement,
) {
  context.save();

  context.strokeStyle = 'rgba(112, 72, 29, 0.18)';
  context.lineWidth = Math.max(textureCanvas.width / 2400, 0.8);
  context.setLineDash([7, 9]);
  for (const route of [
    geoCircle().center([-18, 12]).radius(58)(),
    geoCircle().center([74, -4]).radius(46)(),
    geoCircle().center([-110, 28]).radius(70)(),
  ]) {
    context.beginPath();
    path(route);
    context.stroke();
  }

  context.restore();
}

function buildCombinedTextureCanvas(
  world: FeatureCollectionLike,
  targetFeature: CountryFeature | null,
  palette: GlobePalette,
  textureSize: number,
  isAtlas: boolean,
  atlasPaperImage: HTMLImageElement | null,
) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = textureSize;
  textureCanvas.height = textureSize / 2;

  withTextureContext(textureCanvas, (context) => {
    const projection = geoEquirectangular()
      .translate([textureCanvas.width / 2, textureCanvas.height / 2])
      .scale(textureCanvas.width / (2 * Math.PI));
    const path = geoPath(projection, context);
    context.fillStyle = palette.oceanFill;
    context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

    if (isAtlas) {
      applyAtlasPaperTexture(context, textureCanvas, atlasPaperImage);
    }

    if (isAtlas) {
      drawAtlasExpeditionDetails(context, path, textureCanvas);
    }

    context.beginPath();
    path(geoGraticule10());
    context.strokeStyle = palette.graticule;
    context.lineWidth = isAtlas ? 1.4 : 1.2;
    if (isAtlas) {
      context.setLineDash([3, 8]);
    }
    context.stroke();
    context.setLineDash([]);

    applyCountryShadow(context, path, world, palette);
    drawFeatureCollection(
      context,
      path,
      world,
      palette.countryFill,
      palette.countryStroke,
      isAtlas ? 1.4 : 1.2,
    );
    applyCountryDeboss(context, path, world, palette);

    if (targetFeature) {
      const selectedRings = getCountryHighlightRings(targetFeature).map(
        (ring) => geoCircle().center(ring.center).radius(ring.radius)(),
      );

      context.beginPath();
      path(targetFeature as GeoPermissibleObjects);
      context.fillStyle = palette.selectedFill;
      context.strokeStyle = palette.countryStroke;
      context.lineWidth = isAtlas ? 2 : 1.6;
      context.fill();
      context.stroke();

      for (const selectedRing of selectedRings) {
        context.beginPath();
        path(selectedRing);
        context.strokeStyle = palette.smallCountryCircle;
        context.lineWidth = 3;
        context.stroke();
      }
    }
  });

  return textureCanvas;
}

function buildCountryTextureCanvas(
  world: FeatureCollectionLike,
  targetFeature: CountryFeature | null,
  palette: GlobePalette,
  textureSize: number,
  isAtlas: boolean,
  atlasPaperImage: HTMLImageElement | null,
) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = textureSize;
  textureCanvas.height = textureSize / 2;

  withTextureContext(textureCanvas, (context) => {
    const projection = geoEquirectangular()
      .translate([textureCanvas.width / 2, textureCanvas.height / 2])
      .scale(textureCanvas.width / (2 * Math.PI));
    const path = geoPath(projection, context);
    context.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
    if (isAtlas) {
      applyAtlasPaperTexture(context, textureCanvas, atlasPaperImage);
    }
    if (isAtlas) {
      drawAtlasExpeditionDetails(context, path, textureCanvas);
    }
    context.beginPath();
    path(geoGraticule10());
    context.strokeStyle = palette.graticule;
    context.lineWidth = isAtlas ? 1.4 : 1.2;
    if (isAtlas) {
      context.setLineDash([3, 8]);
    }
    context.stroke();
    context.setLineDash([]);

    drawFeatureCollection(
      context,
      path,
      world,
      palette.countryFill,
      palette.countryStroke,
      isAtlas ? 1.4 : 1.2,
    );
    applyCountryDeboss(context, path, world, palette);

    if (targetFeature) {
      const selectedRings = getCountryHighlightRings(targetFeature).map(
        (ring) => geoCircle().center(ring.center).radius(ring.radius)(),
      );

      context.beginPath();
      path(targetFeature as GeoPermissibleObjects);
      context.fillStyle = palette.selectedFill;
      context.strokeStyle = palette.countryStroke;
      context.lineWidth = isAtlas ? 2 : 1.6;
      context.fill();
      context.stroke();

      for (const selectedRing of selectedRings) {
        context.beginPath();
        path(selectedRing);
        context.strokeStyle = palette.smallCountryCircle;
        context.lineWidth = 3;
        context.stroke();
      }
    }
  });

  return textureCanvas;
}

function getUniformLocation(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string,
) {
  const location = gl.getUniformLocation(program, name);
  if (!location) {
    throw new Error(`Missing WebGL uniform: ${name}`);
  }
  return location;
}

function configureTexture(gl: WebGLRenderingContext, texture: WebGLTexture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function hasAmbientAnimation(palette: GlobePalette) {
  return (
    palette.auroraStrength > 0 ||
    palette.gridStrength > 0 ||
    palette.noiseStrength > 0 ||
    palette.scanlineStrength > 0
  );
}

function getTextureResolution(
  gl: WebGLRenderingContext,
  width: number,
  height: number,
) {
  const textureLimit = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE));
  const maxTextureSize = Math.min(
    Number.isFinite(textureLimit) ? textureLimit : 4096,
    4096,
  );
  const dpr = window.devicePixelRatio || 1;
  const desiredSize = Math.max(width, height) * dpr * 2;

  if (desiredSize >= 3072 && maxTextureSize >= 4096) {
    return 4096;
  }

  if (desiredSize >= 1536 && maxTextureSize >= 2048) {
    return 2048;
  }

  return Math.min(1024, maxTextureSize);
}

function initializeWebGl(canvas: HTMLCanvasElement): WebGlResources {
  const gl =
    canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      desynchronized: true,
      powerPreference: 'low-power',
    }) ?? canvas.getContext('experimental-webgl');

  if (!gl || !(gl instanceof WebGLRenderingContext)) {
    throw new Error('WebGL is not available in this browser.');
  }

  const program = createProgram(gl);
  const mesh = createSphereMesh();
  const overlayPositions = new Float32Array(mesh.positions);
  const positionBuffer = gl.createBuffer();
  const overlayPositionBuffer = gl.createBuffer();
  const uvBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  const texture = gl.createTexture();
  const overlayTexture = gl.createTexture();
  if (!positionBuffer || !overlayPositionBuffer || !uvBuffer || !indexBuffer || !texture || !overlayTexture) {
    throw new Error('Failed to allocate WebGL buffers.');
  }

  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.DYNAMIC_DRAW);
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, overlayPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, overlayPositions, gl.DYNAMIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW);
  const uvLocation = gl.getAttribLocation(program, 'a_uv');
  gl.enableVertexAttribArray(uvLocation);
  gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

  configureTexture(gl, texture);
  configureTexture(gl, overlayTexture);

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);

  return {
    gl,
    indexCount: mesh.indices.length,
    lastRotation: null,
    mesh,
    overlayPositionBuffer,
    overlayPositions,
    overlayTexture,
    positionBuffer,
    program,
    texture,
    uniforms: {
      atmosphereOpacity: getUniformLocation(gl, program, 'u_atmosphereOpacity'),
      atmosphereTint: getUniformLocation(gl, program, 'u_atmosphereTint'),
      auroraStrength: getUniformLocation(gl, program, 'u_auroraStrength'),
      gridColor: getUniformLocation(gl, program, 'u_gridColor'),
      gridStrength: getUniformLocation(gl, program, 'u_gridStrength'),
      nightAlpha: getUniformLocation(gl, program, 'u_nightAlpha'),
      nightColor: getUniformLocation(gl, program, 'u_nightColor'),
      noiseStrength: getUniformLocation(gl, program, 'u_noiseStrength'),
      penumbra: getUniformLocation(gl, program, 'u_penumbra'),
      rimLightColor: getUniformLocation(gl, program, 'u_rimLightColor'),
      rimLightStrength: getUniformLocation(gl, program, 'u_rimLightStrength'),
      scale: getUniformLocation(gl, program, 'u_scale'),
      scanlineDensity: getUniformLocation(gl, program, 'u_scanlineDensity'),
      scanlineStrength: getUniformLocation(gl, program, 'u_scanlineStrength'),
      specularColor: getUniformLocation(gl, program, 'u_specularColor'),
      specularPower: getUniformLocation(gl, program, 'u_specularPower'),
      specularStrength: getUniformLocation(gl, program, 'u_specularStrength'),
      sunDirection: getUniformLocation(gl, program, 'u_sunDirection'),
      texture: getUniformLocation(gl, program, 'u_texture'),
      time: getUniformLocation(gl, program, 'u_time'),
    },
  };
}

function drawGlobe(
  resources: WebGlResources,
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  zoomScale: number,
  currentRotation: [number, number],
  palette: GlobePalette,
  effectTimeSeconds: number,
) {
  const {
    gl,
    indexCount,
    mesh,
    overlayPositionBuffer,
    overlayPositions,
    positionBuffer,
    uniforms,
  } = resources;
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = Math.max(Math.floor(width * dpr), 1);
  const targetHeight = Math.max(Math.floor(height * dpr), 1);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);

  const aspect = width / Math.max(height, 1);
  const radius = 0.9 * zoomScale;
  const scaleX = aspect >= 1 ? radius / aspect : radius;
  const scaleY = aspect >= 1 ? radius : radius * aspect;
  const sunDirection = getRotatedSunDirection(currentRotation);
  const [atmosphereRed, atmosphereGreen, atmosphereBlue] = cssColorToVec3(
    palette.atmosphereTint,
  );
  const [gridRed, gridGreen, gridBlue] = cssColorToVec3(palette.gridColor);
  const { alpha: nightAlpha, rgb: nightRgb } = parseCssColor(palette.nightShade);
  const [rimRed, rimGreen, rimBlue] = cssColorToVec3(palette.rimLightColor);
  const [specularRed, specularGreen, specularBlue] = cssColorToVec3(
    palette.specularColor,
  );
  const hasRaisedCountries = palette.countryElevation > 0;

  if (
    !resources.lastRotation ||
    resources.lastRotation[0] !== currentRotation[0] ||
    resources.lastRotation[1] !== currentRotation[1]
  ) {
    const rotate = geoRotation([currentRotation[0], currentRotation[1], 0]);

    for (let index = 0; index < mesh.sourceCoordinates.length; index += 2) {
      const rotated = rotate([
        mesh.sourceCoordinates[index]!,
        mesh.sourceCoordinates[index + 1]!,
      ]);
      const position = geoToSpherePosition(rotated[0], rotated[1]);
      const targetIndex = (index / 2) * 3;
      const elevatedScale = 1 + palette.countryElevation;
      mesh.positions[targetIndex] = position.x;
      mesh.positions[targetIndex + 1] = position.y;
      mesh.positions[targetIndex + 2] = position.z;
      overlayPositions[targetIndex] = position.x * elevatedScale;
      overlayPositions[targetIndex + 1] = position.y * elevatedScale;
      overlayPositions[targetIndex + 2] = position.z * elevatedScale;
    }

    resources.lastRotation = [...currentRotation];
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(resources.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.positions);
  gl.vertexAttribPointer(
    gl.getAttribLocation(resources.program, 'a_position'),
    3,
    gl.FLOAT,
    false,
    0,
    0,
  );
  gl.uniform1i(uniforms.texture, 0);
  gl.uniform1f(uniforms.atmosphereOpacity, palette.atmosphereOpacity);
  gl.uniform3f(
    uniforms.atmosphereTint,
    atmosphereRed,
    atmosphereGreen,
    atmosphereBlue,
  );
  gl.uniform1f(uniforms.auroraStrength, palette.auroraStrength);
  gl.uniform3f(uniforms.gridColor, gridRed, gridGreen, gridBlue);
  gl.uniform1f(uniforms.gridStrength, palette.gridStrength);
  gl.uniform1f(uniforms.nightAlpha, nightAlpha);
  gl.uniform3f(
    uniforms.nightColor,
    nightRgb[0] / 255,
    nightRgb[1] / 255,
    nightRgb[2] / 255,
  );
  gl.uniform1f(uniforms.noiseStrength, palette.noiseStrength);
  gl.uniform2f(uniforms.scale, scaleX, scaleY);
  gl.uniform1f(uniforms.penumbra, getTerminatorHalfAngleRadians());
  gl.uniform3f(uniforms.rimLightColor, rimRed, rimGreen, rimBlue);
  gl.uniform1f(uniforms.rimLightStrength, palette.rimLightStrength);
  gl.uniform1f(uniforms.scanlineDensity, palette.scanlineDensity);
  gl.uniform1f(uniforms.scanlineStrength, palette.scanlineStrength);
  gl.uniform3f(
    uniforms.specularColor,
    specularRed,
    specularGreen,
    specularBlue,
  );
  gl.uniform1f(uniforms.specularPower, palette.specularPower);
  gl.uniform1f(uniforms.specularStrength, palette.specularStrength);
  gl.uniform3f(
    uniforms.sunDirection,
    sunDirection.x,
    sunDirection.y,
    sunDirection.z,
  );
  gl.uniform1f(uniforms.time, effectTimeSeconds);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, resources.texture);
  gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

  if (hasRaisedCountries) {
    gl.bindBuffer(gl.ARRAY_BUFFER, overlayPositionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, overlayPositions);
    gl.vertexAttribPointer(
      gl.getAttribLocation(resources.program, 'a_position'),
      3,
      gl.FLOAT,
      false,
      0,
      0,
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, resources.overlayTexture);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.BLEND);
  }
}

function drawSelectedCountryOverlay(args: {
  canvas: HTMLCanvasElement;
  country: CountryFeature;
  currentRotation: [number, number];
  height: number;
  mode: GameMode;
  nowMs: number;
  palette: GlobePalette;
  width: number;
  zoomScale: number;
}) {
  const {
    canvas,
    country,
    currentRotation,
    height,
    mode,
    nowMs,
    palette,
    width,
    zoomScale,
  } = args;
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = Math.max(Math.floor(width * dpr), 1);
  const targetHeight = Math.max(Math.floor(height * dpr), 1);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.scale(dpr, dpr);

  const globeRadius = Math.max(Math.min(width, height) * 0.45 * zoomScale, 1);
  const projection = geoOrthographic()
    .scale(Math.max(globeRadius - selectedOverlayInsetPx, 1))
    .center([0, 0])
    .translate([width / 2, height / 2])
    .rotate([currentRotation[0], currentRotation[1], 0]);
  const path = geoPath(projection, context);

  context.save();
  context.beginPath();
  path({ type: 'Sphere' });
  context.clip();

  if (mode === 'capitals') {
    if (
      typeof country.properties.capitalLongitude === 'number' &&
      typeof country.properties.capitalLatitude === 'number'
    ) {
      const capitalPoint = projection([
        country.properties.capitalLongitude,
        country.properties.capitalLatitude,
      ]);

      if (capitalPoint) {
        const [capitalX, capitalY] = capitalPoint;
        const cycleSeconds = 1.6;
        const elapsedSeconds = nowMs * 0.001;
        const waveProgress = (elapsedSeconds % cycleSeconds) / cycleSeconds;

        context.fillStyle = palette.smallCountryCircle;
        context.globalAlpha = 0.95;
        context.beginPath();
        context.arc(capitalX, capitalY, 3, 0, Math.PI * 2);
        context.fill();

        for (let wave = 0; wave < 2; wave += 1) {
          const phase = (waveProgress + wave * 0.5) % 1;
          const radius = 4 + phase * 28;
          const alpha = Math.max(0, 0.6 * (1 - phase));

          context.beginPath();
          context.arc(capitalX, capitalY, radius, 0, Math.PI * 2);
          context.strokeStyle = palette.smallCountryCircle;
          context.globalAlpha = alpha;
          context.lineWidth = 2 - phase * 0.8;
          context.stroke();
        }
      }
    }
  } else {
    const ringPaths = getCountryHighlightRings(country).map((ring) =>
      geoCircle().center(ring.center).radius(ring.radius)(),
    );

    context.beginPath();
    path(country as GeoPermissibleObjects);
    context.fillStyle = palette.selectedFill;
    context.strokeStyle = palette.selectedFill;
    context.globalAlpha = 0.9;
    context.lineWidth = 0.18;
    context.fill();
    context.stroke();
    context.globalAlpha = 1;

    context.strokeStyle = palette.smallCountryCircle;
    context.lineWidth = 1.7;
    for (const ringPath of ringPaths) {
      context.beginPath();
      path(ringPath);
      context.stroke();
    }
  }

  context.globalAlpha = 1;
  context.restore();
}

export function WebGlGlobe({
  country,
  mode,
  width,
  height,
  rotation,
  focusRequest,
  world,
  palette,
  themeId,
}: WebGlGlobeProps) {
  const isAtlas = themeId === 'atlas';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const resourcesRef = useRef<WebGlResources | null>(null);
  const drawCurrentFrameRef = useRef<(now?: number) => void>(() => undefined);
  const targetFeatureRef = useRef<CountryFeature>(country);
  const frameStateRef = useRef({
    currentRotation: rotation,
    height,
    width,
    zoomScale: 1,
  });
  const paletteRef = useRef(palette);
  const [atlasPaperImage, setAtlasPaperImage] =
    useState<HTMLImageElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const baseScale = useMemo(
    () => Math.max(Math.min(width, height) / 2 - 10, 1),
    [height, width],
  );
  const targetFeature = useMemo(
    () =>
      world.features.find(
        (feature): feature is typeof country => feature.id === country.id,
      ) ?? country,
    [country, world.features],
  );
  const { interactionHandlers, isAnimating } = useGlobeInteraction({
    baseScale,
    focusRequest,
    onFrame: ({ rotation: nextRotation, zoomScale: nextZoomScale }) => {
      frameStateRef.current = {
        currentRotation: nextRotation,
        height,
        width,
        zoomScale: nextZoomScale,
      };
      drawCurrentFrameRef.current();
    },
    pointerDirection: { x: 1, y: 1 },
    rotation,
    useStateUpdates: false,
  });
  const ambientAnimationEnabled = useMemo(
    () => hasAmbientAnimation(palette),
    [palette],
  );
  const hasCapitalBlipAnimation = mode === 'capitals';

  useEffect(() => {
    frameStateRef.current = {
      currentRotation: frameStateRef.current.currentRotation,
      height,
      width,
      zoomScale: frameStateRef.current.zoomScale,
    };
  }, [height, width]);

  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

  useEffect(() => {
    targetFeatureRef.current = targetFeature;
  }, [targetFeature]);

  useEffect(() => {
    if (!isAtlas) {
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (!cancelled) {
        setAtlasPaperImage(image);
      }
    };
    image.onerror = () => {
      if (!cancelled) {
        setAtlasPaperImage(null);
      }
    };
    image.src = '/textures/atlas-paper.jpg';

    return () => {
      cancelled = true;
    };
  }, [isAtlas]);

  const drawCurrentFrame = useCallback((now = performance.now()) => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const resources = resourcesRef.current;
    const frameState = frameStateRef.current;

    if (!canvas || !overlayCanvas || !resources) {
      return;
    }

    drawGlobe(
      resources,
      canvas,
      frameState.width,
      frameState.height,
      frameState.zoomScale,
      frameState.currentRotation,
      paletteRef.current,
      now * 0.001,
    );

    drawSelectedCountryOverlay({
      canvas: overlayCanvas,
      country: targetFeatureRef.current,
      currentRotation: frameState.currentRotation,
      height: frameState.height,
      mode,
      nowMs: now,
      palette: paletteRef.current,
      width: frameState.width,
      zoomScale: frameState.zoomScale,
    });
  }, [mode]);

  useEffect(() => {
    drawCurrentFrameRef.current = drawCurrentFrame;
  }, [drawCurrentFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let cancelled = false;

    if (!resourcesRef.current) {
      try {
        resourcesRef.current = initializeWebGl(canvas);
      } catch (error) {
        const nextMessage =
          error instanceof Error
            ? error.message
            : 'WebGL initialization failed.';
        window.setTimeout(() => {
          if (!cancelled) {
            setErrorMessage(nextMessage);
          }
        }, 0);
        return;
      }
    }

    const resources = resourcesRef.current;
    if (!resources) {
      return;
    }

    const gl = resources.gl;
    const textureResolution = getTextureResolution(gl, width, height);
    const hasRaisedCountries = palette.countryElevation > 0;
    const baseTextureCanvas = hasRaisedCountries
      ? buildOceanTextureCanvas(
          world,
          palette,
          textureResolution,
          isAtlas,
          isAtlas ? atlasPaperImage : null,
        )
      : buildCombinedTextureCanvas(
          world,
          null,
          palette,
          textureResolution,
          isAtlas,
          isAtlas ? atlasPaperImage : null,
        );
    const countryTextureCanvas = hasRaisedCountries
      ? buildCountryTextureCanvas(
          world,
          null,
          palette,
          textureResolution,
          isAtlas,
          isAtlas ? atlasPaperImage : null,
        )
      : null;
    gl.activeTexture(gl.TEXTURE0);
    configureTexture(gl, resources.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      baseTextureCanvas,
    );

    if (countryTextureCanvas) {
      gl.activeTexture(gl.TEXTURE0);
      configureTexture(gl, resources.overlayTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        countryTextureCanvas,
      );
    }

    window.setTimeout(() => {
      if (!cancelled) {
        setErrorMessage(null);
      }
    }, 0);

    drawCurrentFrame();

    return () => {
      cancelled = true;
    };
  }, [
    atlasPaperImage,
    drawCurrentFrame,
    height,
    isAtlas,
    palette,
    width,
    world,
  ]);

  useEffect(() => {
    drawCurrentFrame();
  }, [drawCurrentFrame, palette, targetFeature, height, width]);

  useEffect(() => {
    let cancelled = false;
    let frameId = 0;
    let timeoutId = 0;

    const scheduleNextFrame = () => {
      if (cancelled || document.visibilityState === 'hidden') {
        return;
      }

      if (isAnimating) {
        return;
      }

      if (ambientAnimationEnabled || hasCapitalBlipAnimation) {
        timeoutId = window.setTimeout(() => {
          frameId = window.requestAnimationFrame(renderLoop);
        }, 1000 / ambientAnimationFps);
      }
    };

    const renderLoop = (now: number) => {
      drawCurrentFrame(now);
      scheduleNextFrame();
    };

    const handleVisibilityChange = () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);

      if (!cancelled && document.visibilityState === 'visible') {
        drawCurrentFrame();
        scheduleNextFrame();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    scheduleNextFrame();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
    };
  }, [
    ambientAnimationEnabled,
    drawCurrentFrame,
    hasCapitalBlipAnimation,
    isAnimating,
  ]);

  return (
    <div
      style={{
        background: `radial-gradient(circle at 36% 34%, ${palette.hazeInner}, ${palette.hazeOuter} 65%)`,
        height,
        overflow: 'hidden',
        position: 'relative',
        touchAction: 'none',
        width,
      }}
      {...interactionHandlers}
    >
      <div
        style={{
          background: `radial-gradient(circle at 50% 42%, ${palette.atmosphereTint}22, transparent 64%)`,
          inset: 0,
          mixBlendMode: 'screen',
          opacity: Math.min(
            0.2,
            palette.atmosphereOpacity * 0.65 + palette.auroraStrength * 0.35,
          ),
          pointerEvents: 'none',
          position: 'absolute',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          height: '100%',
          position: 'relative',
          width: '100%',
        }}
      />
      <canvas
        ref={overlayCanvasRef}
        style={{
          display: 'block',
          height: '100%',
          inset: 0,
          pointerEvents: 'none',
          position: 'absolute',
          width: '100%',
        }}
      />
      {errorMessage ? (
        <div
          style={{
            alignItems: 'center',
            color: palette.countryStroke,
            display: 'grid',
            inset: 0,
            position: 'absolute',
          }}
        >
          WebGL unavailable
        </div>
      ) : null}
    </div>
  );
}
