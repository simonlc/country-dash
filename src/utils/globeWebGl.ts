import type { GlobePalette, GlobeQualityConfig } from '@/app/theme';
import { cssColorToVec3, parseCssColor } from '@/utils/globeColors';
import {
  geoToSpherePosition,
  getSunPosition,
  getTerminatorHalfAngleRadians,
  getTwilightHalfAngleRadians,
} from '@/utils/globeShared';
import { fragmentShaderSource, vertexShaderSource } from '@/utils/globeShaders';

interface SphereMesh {
  indices: Uint16Array;
  positions: Float32Array;
  uvs: Float32Array;
}

export interface WebGlResources {
  buffers: {
    index: WebGLBuffer;
    position: WebGLBuffer;
    uv: WebGLBuffer;
  };
  cityLightsGlowTexture: WebGLTexture;
  cityLightsPollutionTexture: WebGLTexture;
  cityLightsTexture: WebGLTexture;
  dayTexture: WebGLTexture;
  gl: WebGLRenderingContext;
  indexCount: number;
  nightTexture: WebGLTexture;
  overlayTexture: WebGLTexture;
  program: WebGLProgram;
  reliefTexture: WebGLTexture;
  texture: WebGLTexture;
  waterMaskTexture: WebGLTexture;
  uniforms: {
    cityLightsColor: WebGLUniformLocation;
    cityLightsGlow: WebGLUniformLocation;
    cityLightsIntensity: WebGLUniformLocation;
    cityLightsGlowTexture: WebGLUniformLocation;
    cityLightsPollutionTexture: WebGLUniformLocation;
    cityLightsTexture: WebGLUniformLocation;
    cityLightsThreshold: WebGLUniformLocation;
    dayTexture: WebGLUniformLocation;
    gridColor: WebGLUniformLocation;
    gridStrength: WebGLUniformLocation;
    lightPollutionColor: WebGLUniformLocation;
    lightPollutionIntensity: WebGLUniformLocation;
    lightPollutionSpread: WebGLUniformLocation;
    nightTexture: WebGLUniformLocation;
    nightAlpha: WebGLUniformLocation;
    nightColor: WebGLUniformLocation;
    noiseStrength: WebGLUniformLocation;
    penumbra: WebGLUniformLocation;
    reliefStrength: WebGLUniformLocation;
    reliefTexture: WebGLUniformLocation;
    reliefTexelSize: WebGLUniformLocation;
    rotationMatrix: WebGLUniformLocation;
    scale: WebGLUniformLocation;
    scanlineDensity: WebGLUniformLocation;
    slowScanlineStrength: WebGLUniformLocation;
    scanlineStrength: WebGLUniformLocation;
    sunDirection: WebGLUniformLocation;
    surfaceDistortionStrength: WebGLUniformLocation;
    surfaceScale: WebGLUniformLocation;
    surfaceTextureStrength: WebGLUniformLocation;
    texture: WebGLUniformLocation;
    time: WebGLUniformLocation;
    twilightPenumbra: WebGLUniformLocation;
    umbraDarkness: WebGLUniformLocation;
    useCityLights: WebGLUniformLocation;
    useDayImagery: WebGLUniformLocation;
    useLightPollution: WebGLUniformLocation;
    useNightImagery: WebGLUniformLocation;
    useWaterMask: WebGLUniformLocation;
    waterMaskTexture: WebGLUniformLocation;
  };
}

interface ResolvedPaletteUniforms {
  gridColor: [number, number, number];
  nightAlpha: number;
  nightColor: [number, number, number];
}

interface ResolvedQualityUniforms {
  cityLightsColor: [number, number, number];
  lightPollutionColor: [number, number, number];
}

interface CachedSunDirection {
  minuteBucket: number;
  vector: ReturnType<typeof geoToSpherePosition>;
}

const paletteUniformCache = new WeakMap<
  GlobePalette,
  ResolvedPaletteUniforms
>();
const qualityUniformCache = new WeakMap<
  GlobeQualityConfig,
  ResolvedQualityUniforms
>();
let cachedSunDirection: CachedSunDirection | null = null;
const rotationMatrixScratch = new Float32Array(9);
const rotatedVectorScratch = { x: 0, y: 0, z: 0 };

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
    uvs: new Float32Array(uvs),
  };
}

function writeRotationMatrix(rotation: [number, number], target: Float32Array) {
  const longitude = (rotation[0] * Math.PI) / 180;
  const latitude = (rotation[1] * Math.PI) / 180;
  const cosLongitude = Math.cos(longitude);
  const sinLongitude = Math.sin(longitude);
  const cosLatitude = Math.cos(latitude);
  const sinLatitude = Math.sin(latitude);

  target[0] = cosLongitude;
  target[1] = -sinLongitude * sinLatitude;
  target[2] = sinLongitude * cosLatitude;
  target[3] = 0;
  target[4] = cosLatitude;
  target[5] = sinLatitude;
  target[6] = -sinLongitude;
  target[7] = -cosLongitude * sinLatitude;
  target[8] = cosLongitude * cosLatitude;
  return target;
}

function multiplyRotationMatrixVector(
  rotationMatrix: Float32Array,
  vector: ReturnType<typeof geoToSpherePosition>,
  target: {
    x: number;
    y: number;
    z: number;
  },
) {
  const [
    m00 = 0,
    m01 = 0,
    m02 = 0,
    m10 = 0,
    m11 = 0,
    m12 = 0,
    m20 = 0,
    m21 = 0,
    m22 = 0,
  ] = rotationMatrix;

  target.x = m00 * vector.x + m10 * vector.y + m20 * vector.z;
  target.y = m01 * vector.x + m11 * vector.y + m21 * vector.z;
  target.z = m02 * vector.x + m12 * vector.y + m22 * vector.z;
  return target;
}

function getResolvedPaletteUniforms(palette: GlobePalette) {
  const cachedPalette = paletteUniformCache.get(palette);
  if (cachedPalette) {
    return cachedPalette;
  }

  const { alpha: nightAlpha, rgb: nightRgb } = parseCssColor(
    palette.nightShade,
  );
  const resolvedPalette = {
    gridColor: cssColorToVec3(palette.gridColor),
    nightAlpha,
    nightColor: [nightRgb[0] / 255, nightRgb[1] / 255, nightRgb[2] / 255] as [
      number,
      number,
      number,
    ],
  } satisfies ResolvedPaletteUniforms;

  paletteUniformCache.set(palette, resolvedPalette);
  return resolvedPalette;
}

function getResolvedQualityUniforms(quality: GlobeQualityConfig) {
  const cachedQuality = qualityUniformCache.get(quality);
  if (cachedQuality) {
    return cachedQuality;
  }

  const resolvedQuality = {
    cityLightsColor: cssColorToVec3(quality.cityLightsColor),
    lightPollutionColor: cssColorToVec3(quality.lightPollutionColor),
  } satisfies ResolvedQualityUniforms;

  qualityUniformCache.set(quality, resolvedQuality);
  return resolvedQuality;
}

function getCachedSunDirection(nowMs = Date.now()) {
  const minuteBucket = Math.floor(nowMs / 60_000);
  if (cachedSunDirection?.minuteBucket === minuteBucket) {
    return cachedSunDirection.vector;
  }

  const [longitude, latitude] = getSunPosition();
  const nextSunDirection = geoToSpherePosition(longitude, latitude);
  cachedSunDirection = {
    minuteBucket,
    vector: nextSunDirection,
  };
  return nextSunDirection;
}

function getUniformLocation(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string,
) {
  const location = gl.getUniformLocation(program, name);
  if (location === null) {
    const activeUniformNames: string[] = [];
    const activeUniformCountValue = gl.getProgramParameter(
      program,
      gl.ACTIVE_UNIFORMS,
    ) as unknown;

    if (typeof activeUniformCountValue === 'number') {
      for (let index = 0; index < activeUniformCountValue; index += 1) {
        const activeUniform = gl.getActiveUniform(program, index);
        if (activeUniform?.name) {
          activeUniformNames.push(activeUniform.name);
        }
      }
    }

    throw new Error(
      `Missing WebGL uniform: ${name}. Active uniforms: ${activeUniformNames.join(', ')}`,
    );
  }
  return location;
}

function isPowerOfTwo(value: number) {
  return value > 0 && (value & (value - 1)) === 0;
}

export function configureTexture(
  gl: WebGLRenderingContext,
  texture: WebGLTexture,
  width = 1,
  height = 1,
) {
  const isPowerOfTwoTexture = isPowerOfTwo(width) && isPowerOfTwo(height);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_S,
    isPowerOfTwoTexture ? gl.REPEAT : gl.CLAMP_TO_EDGE,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

export function hasAmbientAnimation(palette: GlobePalette) {
  return palette.scanlineStrength > 0;
}

export function getTextureResolution(
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

function uploadSolidTexture(
  gl: WebGLRenderingContext,
  unit: number,
  texture: WebGLTexture,
  rgba: [number, number, number, number],
) {
  gl.activeTexture(unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array(rgba),
  );
}

export function initializeWebGl(canvas: HTMLCanvasElement): WebGlResources {
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
  const positionBuffer = gl.createBuffer();
  const uvBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  const texture = gl.createTexture();
  const overlayTexture = gl.createTexture();
  const reliefTexture = gl.createTexture();
  const cityLightsTexture = gl.createTexture();
  const cityLightsGlowTexture = gl.createTexture();
  const cityLightsPollutionTexture = gl.createTexture();
  const dayTexture = gl.createTexture();
  const nightTexture = gl.createTexture();
  const waterMaskTexture = gl.createTexture();
  if (
    !positionBuffer ||
    !uvBuffer ||
    !indexBuffer ||
    !texture ||
    !overlayTexture ||
    !reliefTexture ||
    !cityLightsTexture ||
    !cityLightsGlowTexture ||
    !cityLightsPollutionTexture ||
    !dayTexture ||
    !nightTexture ||
    !waterMaskTexture
  ) {
    throw new Error('Failed to allocate WebGL buffers.');
  }

  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
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

  configureTexture(gl, texture);
  configureTexture(gl, overlayTexture);
  configureTexture(gl, reliefTexture);
  configureTexture(gl, cityLightsTexture);
  configureTexture(gl, cityLightsGlowTexture);
  configureTexture(gl, cityLightsPollutionTexture);
  configureTexture(gl, dayTexture);
  configureTexture(gl, nightTexture);
  configureTexture(gl, waterMaskTexture);
  uploadSolidTexture(gl, gl.TEXTURE1, reliefTexture, [128, 128, 128, 255]);
  uploadSolidTexture(gl, gl.TEXTURE2, cityLightsTexture, [0, 0, 0, 255]);
  uploadSolidTexture(gl, gl.TEXTURE3, cityLightsGlowTexture, [0, 0, 0, 255]);
  uploadSolidTexture(
    gl,
    gl.TEXTURE4,
    cityLightsPollutionTexture,
    [0, 0, 0, 255],
  );
  uploadSolidTexture(gl, gl.TEXTURE5, dayTexture, [255, 255, 255, 255]);
  uploadSolidTexture(gl, gl.TEXTURE6, nightTexture, [0, 0, 0, 255]);
  uploadSolidTexture(gl, gl.TEXTURE7, waterMaskTexture, [255, 255, 255, 255]);
  gl.activeTexture(gl.TEXTURE0);

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);

  const uniforms = {
    cityLightsColor: getUniformLocation(gl, program, 'u_cityLightsColor'),
    cityLightsGlow: getUniformLocation(gl, program, 'u_cityLightsGlow'),
    cityLightsGlowTexture: getUniformLocation(
      gl,
      program,
      'u_cityLightsGlowTexture',
    ),
    cityLightsIntensity: getUniformLocation(
      gl,
      program,
      'u_cityLightsIntensity',
    ),
    cityLightsPollutionTexture: getUniformLocation(
      gl,
      program,
      'u_cityLightsPollutionTexture',
    ),
    cityLightsTexture: getUniformLocation(gl, program, 'u_cityLightsTexture'),
    cityLightsThreshold: getUniformLocation(
      gl,
      program,
      'u_cityLightsThreshold',
    ),
    dayTexture: getUniformLocation(gl, program, 'u_dayTexture'),
    gridColor: getUniformLocation(gl, program, 'u_gridColor'),
    gridStrength: getUniformLocation(gl, program, 'u_gridStrength'),
    lightPollutionColor: getUniformLocation(
      gl,
      program,
      'u_lightPollutionColor',
    ),
    lightPollutionIntensity: getUniformLocation(
      gl,
      program,
      'u_lightPollutionIntensity',
    ),
    lightPollutionSpread: getUniformLocation(
      gl,
      program,
      'u_lightPollutionSpread',
    ),
    nightTexture: getUniformLocation(gl, program, 'u_nightTexture'),
    nightAlpha: getUniformLocation(gl, program, 'u_nightAlpha'),
    nightColor: getUniformLocation(gl, program, 'u_nightColor'),
    noiseStrength: getUniformLocation(gl, program, 'u_noiseStrength'),
    penumbra: getUniformLocation(gl, program, 'u_penumbra'),
    reliefStrength: getUniformLocation(gl, program, 'u_reliefStrength'),
    reliefTexture: getUniformLocation(gl, program, 'u_reliefTexture'),
    reliefTexelSize: getUniformLocation(gl, program, 'u_reliefTexelSize'),
    rotationMatrix: getUniformLocation(gl, program, 'u_rotationMatrix'),
    scale: getUniformLocation(gl, program, 'u_scale'),
    scanlineDensity: getUniformLocation(gl, program, 'u_scanlineDensity'),
    slowScanlineStrength: getUniformLocation(
      gl,
      program,
      'u_slowScanlineStrength',
    ),
    scanlineStrength: getUniformLocation(gl, program, 'u_scanlineStrength'),
    sunDirection: getUniformLocation(gl, program, 'u_sunDirection'),
    surfaceDistortionStrength: getUniformLocation(
      gl,
      program,
      'u_surfaceDistortionStrength',
    ),
    surfaceScale: getUniformLocation(gl, program, 'u_surfaceScale'),
    surfaceTextureStrength: getUniformLocation(
      gl,
      program,
      'u_surfaceTextureStrength',
    ),
    texture: getUniformLocation(gl, program, 'u_texture'),
    time: getUniformLocation(gl, program, 'u_time'),
    twilightPenumbra: getUniformLocation(gl, program, 'u_twilightPenumbra'),
    umbraDarkness: getUniformLocation(gl, program, 'u_umbraDarkness'),
    useCityLights: getUniformLocation(gl, program, 'u_useCityLights'),
    useDayImagery: getUniformLocation(gl, program, 'u_useDayImagery'),
    useLightPollution: getUniformLocation(gl, program, 'u_useLightPollution'),
    useNightImagery: getUniformLocation(gl, program, 'u_useNightImagery'),
    useWaterMask: getUniformLocation(gl, program, 'u_useWaterMask'),
    waterMaskTexture: getUniformLocation(gl, program, 'u_waterMaskTexture'),
  };
  gl.uniform1i(uniforms.texture, 0);
  gl.uniform1i(uniforms.reliefTexture, 1);
  gl.uniform1i(uniforms.cityLightsTexture, 2);
  gl.uniform1i(uniforms.cityLightsGlowTexture, 3);
  gl.uniform1i(uniforms.cityLightsPollutionTexture, 4);
  gl.uniform1i(uniforms.dayTexture, 5);
  gl.uniform1i(uniforms.nightTexture, 6);
  gl.uniform1i(uniforms.waterMaskTexture, 7);

  return {
    buffers: {
      index: indexBuffer,
      position: positionBuffer,
      uv: uvBuffer,
    },
    cityLightsGlowTexture,
    cityLightsPollutionTexture,
    cityLightsTexture,
    dayTexture,
    gl,
    indexCount: mesh.indices.length,
    nightTexture,
    overlayTexture,
    program,
    reliefTexture,
    texture,
    waterMaskTexture,
    uniforms,
  };
}

export function disposeWebGl(resources: WebGlResources) {
  const { gl } = resources;

  gl.deleteBuffer(resources.buffers.index);
  gl.deleteBuffer(resources.buffers.position);
  gl.deleteBuffer(resources.buffers.uv);
  gl.deleteTexture(resources.cityLightsGlowTexture);
  gl.deleteTexture(resources.cityLightsPollutionTexture);
  gl.deleteTexture(resources.cityLightsTexture);
  gl.deleteTexture(resources.dayTexture);
  gl.deleteTexture(resources.nightTexture);
  gl.deleteTexture(resources.overlayTexture);
  gl.deleteTexture(resources.reliefTexture);
  gl.deleteTexture(resources.texture);
  gl.deleteTexture(resources.waterMaskTexture);
  gl.deleteProgram(resources.program);
}

export function drawGlobe(
  resources: WebGlResources,
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  zoomScale: number,
  currentRotation: [number, number],
  palette: GlobePalette,
  quality: GlobeQualityConfig,
  slowScanlineStrength: number,
  effectTimeSeconds: number,
  reliefStrength: number,
  reliefTexelSize: [number, number],
) {
  const {
    cityLightsGlowTexture,
    cityLightsPollutionTexture,
    cityLightsTexture,
    dayTexture,
    gl,
    indexCount,
    nightTexture,
    uniforms,
    waterMaskTexture,
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
  const rotationMatrix = writeRotationMatrix(
    currentRotation,
    rotationMatrixScratch,
  );
  const sunDirection = multiplyRotationMatrixVector(
    rotationMatrix,
    getCachedSunDirection(),
    rotatedVectorScratch,
  );
  const resolvedPalette = getResolvedPaletteUniforms(palette);
  const resolvedQuality = getResolvedQualityUniforms(quality);
  const hasRaisedCountries = palette.countryElevation > 0;

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(resources.program);
  gl.uniform3f(
    uniforms.cityLightsColor,
    resolvedQuality.cityLightsColor[0],
    resolvedQuality.cityLightsColor[1],
    resolvedQuality.cityLightsColor[2],
  );
  gl.uniform1f(uniforms.cityLightsGlow, quality.cityLightsGlow);
  gl.uniform1f(uniforms.cityLightsIntensity, quality.cityLightsIntensity);
  gl.uniform1f(uniforms.cityLightsThreshold, quality.cityLightsThreshold);
  gl.uniform1f(uniforms.reliefStrength, reliefStrength);
  gl.uniform1f(uniforms.umbraDarkness, quality.umbraDarkness);
  gl.uniform2f(
    uniforms.reliefTexelSize,
    reliefTexelSize[0],
    reliefTexelSize[1],
  );
  gl.uniform3f(
    uniforms.lightPollutionColor,
    resolvedQuality.lightPollutionColor[0],
    resolvedQuality.lightPollutionColor[1],
    resolvedQuality.lightPollutionColor[2],
  );
  gl.uniform1f(
    uniforms.lightPollutionIntensity,
    quality.lightPollutionIntensity,
  );
  gl.uniform1f(uniforms.lightPollutionSpread, quality.lightPollutionSpread);
  gl.uniform1f(uniforms.useCityLights, quality.cityLightsEnabled ? 1 : 0);
  gl.uniform1f(uniforms.useDayImagery, quality.dayImageryEnabled ? 1 : 0);
  gl.uniform1f(
    uniforms.useLightPollution,
    quality.lightPollutionEnabled ? 1 : 0,
  );
  gl.uniform1f(uniforms.useNightImagery, quality.nightImageryEnabled ? 1 : 0);
  gl.uniform1f(uniforms.useWaterMask, quality.waterMaskEnabled ? 1 : 0);
  gl.uniform3f(
    uniforms.gridColor,
    resolvedPalette.gridColor[0],
    resolvedPalette.gridColor[1],
    resolvedPalette.gridColor[2],
  );
  gl.uniform1f(uniforms.gridStrength, palette.gridStrength);
  gl.uniform1f(uniforms.nightAlpha, resolvedPalette.nightAlpha);
  gl.uniform3f(
    uniforms.nightColor,
    resolvedPalette.nightColor[0],
    resolvedPalette.nightColor[1],
    resolvedPalette.nightColor[2],
  );
  gl.uniform1f(uniforms.noiseStrength, palette.noiseStrength);
  gl.uniformMatrix3fv(uniforms.rotationMatrix, false, rotationMatrix);
  gl.uniform2f(uniforms.scale, scaleX, scaleY);
  gl.uniform1f(uniforms.penumbra, getTerminatorHalfAngleRadians());
  gl.uniform1f(uniforms.twilightPenumbra, getTwilightHalfAngleRadians());
  gl.uniform1f(uniforms.scanlineDensity, palette.scanlineDensity);
  gl.uniform1f(uniforms.scanlineStrength, palette.scanlineStrength);
  gl.uniform1f(uniforms.slowScanlineStrength, slowScanlineStrength);
  gl.uniform1f(
    uniforms.surfaceDistortionStrength,
    palette.surfaceDistortionStrength,
  );
  gl.uniform1f(uniforms.surfaceTextureStrength, palette.surfaceTextureStrength);
  gl.uniform3f(
    uniforms.sunDirection,
    sunDirection.x,
    sunDirection.y,
    sunDirection.z,
  );
  gl.uniform1f(uniforms.surfaceScale, 1);
  gl.uniform1f(uniforms.time, effectTimeSeconds);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, resources.texture);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, resources.reliefTexture);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, cityLightsTexture);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, cityLightsGlowTexture);
  gl.activeTexture(gl.TEXTURE4);
  gl.bindTexture(gl.TEXTURE_2D, cityLightsPollutionTexture);
  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_2D, dayTexture);
  gl.activeTexture(gl.TEXTURE6);
  gl.bindTexture(gl.TEXTURE_2D, nightTexture);
  gl.activeTexture(gl.TEXTURE7);
  gl.bindTexture(gl.TEXTURE_2D, waterMaskTexture);
  gl.activeTexture(gl.TEXTURE0);
  gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

  if (hasRaisedCountries) {
    gl.uniform1f(uniforms.useCityLights, 0);
    gl.uniform1f(uniforms.useDayImagery, 0);
    gl.uniform1f(uniforms.useLightPollution, 0);
    gl.uniform1f(uniforms.useNightImagery, 0);
    gl.uniform1f(uniforms.useWaterMask, 0);
    gl.uniform1f(uniforms.gridStrength, 0);
    gl.uniform1f(uniforms.noiseStrength, 0);
    gl.uniform1f(uniforms.scanlineStrength, 0);
    gl.uniform1f(uniforms.slowScanlineStrength, 0);
    gl.uniform1f(uniforms.surfaceScale, 1 + palette.countryElevation);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, resources.overlayTexture);
    gl.activeTexture(gl.TEXTURE0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.BLEND);
  }
}
