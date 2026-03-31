import {
  geoCentroid,
  geoCircle,
  geoEquirectangular,
  geoGraticule10,
  geoLength,
  geoPath,
  geoRotation,
  type GeoPermissibleObjects,
} from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GlobePalette } from '@/app/theme';
import type { CountryFeature, FeatureCollectionLike } from '@/features/game/types';
import {
  geoToSpherePosition,
  getSunDirection,
  useGlobeInteraction,
  type GlobeViewProps,
} from './globeShared';

interface WebGlGlobeProps extends GlobeViewProps {
  palette: GlobePalette;
}

interface WebGlResources {
  gl: WebGLRenderingContext;
  indexCount: number;
  mesh: SphereMesh;
  positionBuffer: WebGLBuffer;
  program: WebGLProgram;
  texture: WebGLTexture;
  uniforms: {
    hazeColor: WebGLUniformLocation;
    nightStrength: WebGLUniformLocation;
    scale: WebGLUniformLocation;
    sunDirection: WebGLUniformLocation;
    texture: WebGLUniformLocation;
  };
}

interface SphereMesh {
  indices: Uint16Array;
  positions: Float32Array;
  sourceCoordinates: Float32Array;
  uvs: Float32Array;
}

const vertexShaderSource = `
  attribute vec3 a_position;
  attribute vec2 a_uv;

  uniform vec2 u_scale;

  varying vec2 v_uv;
  varying vec3 v_rotatedNormal;

  void main() {
    gl_Position = vec4(a_position.x * u_scale.x, a_position.y * u_scale.y, a_position.z * 0.5, 1.0);
    v_uv = vec2(1.0 - a_uv.x, a_uv.y);
    v_rotatedNormal = a_position;
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform sampler2D u_texture;
  uniform vec3 u_hazeColor;
  uniform vec3 u_sunDirection;
  uniform float u_nightStrength;

  varying vec2 v_uv;
  varying vec3 v_rotatedNormal;

  void main() {
    vec4 baseColor = texture2D(u_texture, v_uv);
    float light = dot(normalize(v_rotatedNormal), normalize(u_sunDirection));
    float nightMix = smoothstep(0.08, -0.58, light) * u_nightStrength;
    float rim = pow(1.0 - max(v_rotatedNormal.z, 0.0), 3.0);
    vec3 shaded = mix(baseColor.rgb, baseColor.rgb * 0.84, nightMix);
    shaded += u_hazeColor * rim * 0.08;
    gl_FragColor = vec4(shaded, baseColor.a);
  }
`;

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
    const message = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error.';
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
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? 'Unknown program link error.';
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

function createSphereMesh(latitudeBands = 96, longitudeBands = 192): SphereMesh {
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

function toRgbTriplet(color: string): [number, number, number] {
  const hex = color.replace('#', '');
  const fullHex =
    hex.length === 3
      ? hex
          .split('')
          .map((value) => value + value)
          .join('')
      : hex;

  return [
    parseInt(fullHex.slice(0, 2), 16) / 255,
    parseInt(fullHex.slice(2, 4), 16) / 255,
    parseInt(fullHex.slice(4, 6), 16) / 255,
  ];
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

function buildTextureCanvas(
  world: FeatureCollectionLike,
  targetFeature: CountryFeature,
  palette: GlobePalette,
  textureSize: number,
) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = textureSize;
  textureCanvas.height = textureSize / 2;
  const context = textureCanvas.getContext('2d');

  if (!context) {
    throw new Error('Failed to create globe texture context.');
  }

  const projection = geoEquirectangular()
    .translate([textureCanvas.width / 2, textureCanvas.height / 2])
    .scale(textureCanvas.width / (2 * Math.PI));
  const path = geoPath(projection, context);
  const selectedCircle = geoCircle()
    .center(geoCentroid(targetFeature as GeoPermissibleObjects))
    .radius(1)();

  context.fillStyle = palette.oceanFill;
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  context.beginPath();
  path(geoGraticule10());
  context.strokeStyle = palette.graticule;
  context.lineWidth = 0.9;
  context.stroke();

  drawFeatureCollection(
    context,
    path,
    world,
    palette.countryFill,
    palette.countryStroke,
    1.2,
  );

  context.beginPath();
  path(targetFeature as GeoPermissibleObjects);
  context.fillStyle = palette.selectedFill;
  context.strokeStyle = palette.countryStroke;
  context.lineWidth = 1.6;
  context.fill();
  context.stroke();

  if (geoLength(targetFeature) < 0.02) {
    context.beginPath();
    path(selectedCircle);
    context.strokeStyle = palette.smallCountryCircle;
    context.lineWidth = 3;
    context.stroke();
  }

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

function initializeWebGl(canvas: HTMLCanvasElement): WebGlResources {
  const gl =
    canvas.getContext('webgl', { alpha: true, antialias: true }) ??
    canvas.getContext('experimental-webgl');

  if (!gl || !(gl instanceof WebGLRenderingContext)) {
    throw new Error('WebGL is not available in this browser.');
  }

  const program = createProgram(gl);
  const mesh = createSphereMesh();
  const positionBuffer = gl.createBuffer();
  const uvBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  const texture = gl.createTexture();

  if (!positionBuffer || !uvBuffer || !indexBuffer || !texture) {
    throw new Error('Failed to allocate WebGL buffers.');
  }

  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.DYNAMIC_DRAW);
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW);
  const uvLocation = gl.getAttribLocation(program, 'a_uv');
  gl.enableVertexAttribArray(uvLocation);
  gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);

  return {
    gl,
    indexCount: mesh.indices.length,
    mesh,
    positionBuffer,
    program,
    texture,
    uniforms: {
      hazeColor: getUniformLocation(gl, program, 'u_hazeColor'),
      nightStrength: getUniformLocation(gl, program, 'u_nightStrength'),
      scale: getUniformLocation(gl, program, 'u_scale'),
      sunDirection: getUniformLocation(gl, program, 'u_sunDirection'),
      texture: getUniformLocation(gl, program, 'u_texture'),
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
) {
  const { gl, indexCount, mesh, positionBuffer, uniforms } = resources;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  gl.viewport(0, 0, canvas.width, canvas.height);

  const aspect = width / Math.max(height, 1);
  const radius = 0.9 * zoomScale;
  const scaleX = aspect >= 1 ? radius / aspect : radius;
  const scaleY = aspect >= 1 ? radius : radius * aspect;
  const sunDirection = getSunDirection();
  const hazeColor = toRgbTriplet(palette.hazeInner);
  const rotate = geoRotation([currentRotation[0], currentRotation[1], 0]);

  for (let index = 0; index < mesh.sourceCoordinates.length; index += 2) {
    const rotated = rotate([
      mesh.sourceCoordinates[index]!,
      mesh.sourceCoordinates[index + 1]!,
    ]);
    const position = geoToSpherePosition(rotated[0], rotated[1]);
    const targetIndex = (index / 2) * 3;
    mesh.positions[targetIndex] = position.x;
    mesh.positions[targetIndex + 1] = position.y;
    mesh.positions[targetIndex + 2] = position.z;
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(resources.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.positions);
  gl.uniform1i(uniforms.texture, 0);
  gl.uniform2f(uniforms.scale, scaleX, scaleY);
  gl.uniform3f(uniforms.sunDirection, sunDirection.x, sunDirection.y, sunDirection.z);
  gl.uniform3f(uniforms.hazeColor, hazeColor[0], hazeColor[1], hazeColor[2]);
  gl.uniform1f(uniforms.nightStrength, 0.32);
  gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
}

export function WebGlGlobe({
  country,
  width,
  height,
  rotation,
  focusRequest,
  world,
  palette,
}: WebGlGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resourcesRef = useRef<WebGlResources | null>(null);
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
  const { currentRotation, interactionHandlers, zoomScale } = useGlobeInteraction({
    baseScale,
    focusRequest,
    rotation,
  });

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
          error instanceof Error ? error.message : 'WebGL initialization failed.';
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
    const textureLimit = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE));
    const textureSize = Math.min(
      Number.isFinite(textureLimit) ? textureLimit : 4096,
      8192,
    );
    const textureCanvas = buildTextureCanvas(
      world,
      targetFeature,
      palette,
      textureSize >= 8192 ? 8192 : textureSize >= 4096 ? 4096 : 2048,
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, resources.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      textureCanvas,
    );
    gl.generateMipmap(gl.TEXTURE_2D);

    window.setTimeout(() => {
      if (!cancelled) {
        setErrorMessage(null);
      }
    }, 0);

    return () => {
      cancelled = true;
    };
  }, [palette, targetFeature, world]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resources = resourcesRef.current;
    if (!canvas || !resources) {
      return;
    }

    drawGlobe(resources, canvas, width, height, zoomScale, currentRotation, palette);
  }, [currentRotation, height, palette, width, zoomScale]);

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
      <canvas
        ref={canvasRef}
        style={{ display: 'block', height: '100%', width: '100%' }}
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
