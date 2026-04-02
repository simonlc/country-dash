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
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AppThemeId,
  GlobePalette,
  GlobeQualityConfig,
} from '@/app/theme';
import type {
  CountryFeature,
  FeatureCollectionLike,
  GameMode,
} from '@/features/game/types';

interface WebGlGlobeProps extends GlobeViewProps {
  palette: GlobePalette;
  quality: GlobeQualityConfig;
  themeId: AppThemeId;
}

interface SphereMesh {
  indices: Uint16Array;
  positions: Float32Array;
  uvs: Float32Array;
}

interface PreparedCityLightsMaps {
  glow: HTMLCanvasElement;
  pollution: HTMLCanvasElement;
}

interface WebGlResources {
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
    atmosphereOpacity: WebGLUniformLocation;
    atmosphereTint: WebGLUniformLocation;
    auroraStrength: WebGLUniformLocation;
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
    rimLightColor: WebGLUniformLocation;
    rimLightStrength: WebGLUniformLocation;
    rotationMatrix: WebGLUniformLocation;
    scale: WebGLUniformLocation;
    scanlineDensity: WebGLUniformLocation;
    slowScanlineStrength: WebGLUniformLocation;
    scanlineStrength: WebGLUniformLocation;
    surfaceDistortionStrength: WebGLUniformLocation;
    surfaceScale: WebGLUniformLocation;
    surfaceTextureStrength: WebGLUniformLocation;
    reliefStrength: WebGLUniformLocation;
    reliefTexture: WebGLUniformLocation;
    reliefTexelSize: WebGLUniformLocation;
    specularColor: WebGLUniformLocation;
    specularPower: WebGLUniformLocation;
    specularStrength: WebGLUniformLocation;
    sunDirection: WebGLUniformLocation;
    texture: WebGLUniformLocation;
    time: WebGLUniformLocation;
    umbraDarkness: WebGLUniformLocation;
    useCityLights: WebGLUniformLocation;
    useDayImagery: WebGLUniformLocation;
    useLightPollution: WebGLUniformLocation;
    useNightImagery: WebGLUniformLocation;
    useWaterMask: WebGLUniformLocation;
    waterMaskTexture: WebGLUniformLocation;
  };
}

const ambientAnimationFps = 12;
const selectedOverlayInsetPx = 0.35;
type HydroFeatureCollection = FeatureCollection<Geometry, GeoJsonProperties>;

const vertexShaderSource = `
  attribute vec3 a_position;
  attribute vec2 a_uv;

  uniform mat3 u_rotationMatrix;
  uniform vec2 u_scale;
  uniform float u_surfaceScale;

  varying vec2 v_uv;
  varying vec3 v_normal;
  varying vec3 v_surfaceNormal;

  void main() {
    vec3 rotatedPosition = u_rotationMatrix * a_position;
    vec3 surfacePosition = rotatedPosition * u_surfaceScale;
    gl_Position = vec4(
      surfacePosition.x * u_scale.x,
      surfacePosition.y * u_scale.y,
      surfacePosition.z * 0.5,
      1.0
    );
    v_uv = a_uv;
    v_normal = rotatedPosition;
    v_surfaceNormal = a_position;
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform vec3 u_atmosphereTint;
  uniform vec3 u_cityLightsColor;
  uniform vec3 u_gridColor;
  uniform vec3 u_lightPollutionColor;
  uniform vec3 u_rimLightColor;
  uniform vec3 u_specularColor;
  uniform float u_atmosphereOpacity;
  uniform float u_auroraStrength;
  uniform float u_cityLightsGlow;
  uniform float u_cityLightsIntensity;
  uniform float u_cityLightsThreshold;
  uniform float u_gridStrength;
  uniform float u_lightPollutionIntensity;
  uniform float u_lightPollutionSpread;
  uniform float u_nightAlpha;
  uniform float u_noiseStrength;
  uniform vec3 u_nightColor;
  uniform sampler2D u_cityLightsTexture;
  uniform sampler2D u_cityLightsGlowTexture;
  uniform sampler2D u_cityLightsPollutionTexture;
  uniform sampler2D u_dayTexture;
  uniform sampler2D u_nightTexture;
  uniform sampler2D u_texture;
  uniform sampler2D u_waterMaskTexture;
  uniform float u_penumbra;
  uniform float u_rimLightStrength;
  uniform float u_scanlineDensity;
  uniform float u_slowScanlineStrength;
  uniform float u_scanlineStrength;
  uniform float u_surfaceDistortionStrength;
  uniform float u_surfaceTextureStrength;
  uniform float u_reliefStrength;
  uniform float u_umbraDarkness;
  uniform sampler2D u_reliefTexture;
  uniform vec2 u_reliefTexelSize;
  uniform float u_specularPower;
  uniform float u_specularStrength;
  uniform float u_useCityLights;
  uniform float u_useDayImagery;
  uniform float u_useLightPollution;
  uniform float u_useNightImagery;
  uniform float u_useWaterMask;
  uniform vec3 u_sunDirection;
  uniform float u_time;

  varying vec2 v_uv;
  varying vec3 v_normal;
  varying vec3 v_surfaceNormal;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    float a = hash(cell);
    float b = hash(cell + vec2(1.0, 0.0));
    float c = hash(cell + vec2(0.0, 1.0));
    float d = hash(cell + vec2(1.0, 1.0));
    vec2 smooth = local * local * (3.0 - 2.0 * local);
    return mix(mix(a, b, smooth.x), mix(c, d, smooth.x), smooth.y);
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.5;
    vec2 p = point;
    for (int octave = 0; octave < 4; octave += 1) {
      value += noise(p) * amplitude;
      p *= 2.03;
      amplitude *= 0.52;
    }
    return value;
  }

  float sampleRelief(vec2 uv) {
    vec3 reliefSample = texture2D(u_reliefTexture, uv).rgb;
    return dot(reliefSample, vec3(0.299, 0.587, 0.114));
  }

  float sampleCityLights(vec2 uv) {
    vec3 cityLightsSample = texture2D(u_cityLightsTexture, uv).rgb;
    return dot(cityLightsSample, vec3(0.299, 0.587, 0.114));
  }

  float sampleCityLightsGlow(vec2 uv) {
    vec3 sample = texture2D(u_cityLightsGlowTexture, uv).rgb;
    return dot(sample, vec3(0.299, 0.587, 0.114));
  }

  float sampleCityLightsPollution(vec2 uv) {
    vec3 sample = texture2D(u_cityLightsPollutionTexture, uv).rgb;
    return dot(sample, vec3(0.299, 0.587, 0.114));
  }

  float compressRadiance(float radiance, float exposure) {
    return log2(1.0 + radiance * exposure) / log2(1.0 + exposure);
  }

  void main() {
    vec4 baseColor = texture2D(u_texture, v_uv);
    vec3 dayImagery = texture2D(u_dayTexture, v_uv).rgb;
    vec3 nightImagery = texture2D(u_nightTexture, v_uv).rgb;
    vec4 waterMaskSample = texture2D(u_waterMaskTexture, v_uv);
    float waterMask = max(waterMaskSample.r, waterMaskSample.a);
    float imageryMask = mix(1.0, waterMask, u_useWaterMask);
    vec3 normal = normalize(v_normal);
    vec3 sweepSurfaceNormal = normalize(v_surfaceNormal);
    vec3 sunDirection = normalize(u_sunDirection);
    float reliefEnabled = step(0.0001, u_reliefStrength);

    float lon = (v_uv.x - 0.5) * 6.28318530718;
    float lat = (0.5 - v_uv.y) * 3.14159265359;
    vec3 east = normalize(vec3(cos(lon), 0.0, sin(lon)));
    vec3 north = normalize(vec3(-sin(lon) * sin(lat), cos(lat), cos(lon) * sin(lat)));
    float hWest = sampleRelief(v_uv - vec2(u_reliefTexelSize.x, 0.0));
    float hEast = sampleRelief(v_uv + vec2(u_reliefTexelSize.x, 0.0));
    float hSouth = sampleRelief(v_uv + vec2(0.0, u_reliefTexelSize.y));
    float hNorth = sampleRelief(v_uv - vec2(0.0, u_reliefTexelSize.y));
    float slopeEast = hEast - hWest;
    float slopeNorth = hNorth - hSouth;
    vec3 reliefNormal = normalize(
      normal - east * slopeEast * u_reliefStrength - north * slopeNorth * u_reliefStrength
    );

    float reliefMask = smoothstep(0.08, 0.38, sampleRelief(v_uv)) * reliefEnabled;
    normal = normalize(mix(normal, reliefNormal, reliefMask));

    float light = dot(normal, sunDirection);
    float twilight = smoothstep(u_penumbra, -u_penumbra, light) * u_nightAlpha;
    float nightSide = 1.0 - smoothstep(-u_penumbra, u_penumbra, light);
    float nightBlend = clamp(max(twilight, nightSide), 0.0, 1.0);
    float umbraMix = nightBlend * u_umbraDarkness;
    float dayImageryMix = u_useDayImagery * 0.6 * imageryMask;
    vec3 dayColor = mix(baseColor.rgb, dayImagery, dayImageryMix);
    dayColor = mix(dayColor, dayImagery, u_useWaterMask * waterMask * 0.85);
    vec3 fallbackNight = mix(dayColor, u_nightColor, 0.72);
    float nightImageryMix = nightBlend * u_useNightImagery * imageryMask;
    vec3 shaded = mix(dayColor, fallbackNight, umbraMix);
    shaded = mix(shaded, nightImagery, nightImageryMix);
    float umbra = umbraMix;
    float umbraShade = umbraMix;
    vec3 viewDirection = vec3(0.0, 0.0, 1.0);

    float paperFiber = fbm(v_uv * vec2(1100.0, 540.0));
    float paperTooth = fbm(v_uv * vec2(2800.0, 1360.0));
    normal = normalize(
      normal +
      (paperTooth - 0.5) *
      (east * 0.065 + north * 0.045) *
      u_surfaceDistortionStrength *
      (1.0 - umbraShade * 0.7)
    );
    light = dot(normal, sunDirection);
    float rawDaylight = clamp(light * 0.5 + 0.5, 0.0, 1.0);
    float rawDirectLight = clamp(light, 0.0, 1.0);
    float rawSunVisibility = smoothstep(-u_penumbra * 0.2, u_penumbra * 0.6, light);
    float lightingPresence = u_umbraDarkness;
    float daylight = mix(1.0, rawDaylight, lightingPresence);
    float directLight = mix(1.0, rawDirectLight, lightingPresence);
    float sunVisibility = rawSunVisibility * lightingPresence;

    float facing = clamp(normal.z, 0.0, 1.0);
    float rim = pow(1.0 - facing, 2.5) * u_rimLightStrength * (0.22 + daylight * 0.48) * sunVisibility;
    float specular = pow(
      max(dot(reflect(-sunDirection, normal), viewDirection), 0.0),
      u_specularPower
    ) * u_specularStrength * directLight * sunVisibility;
    vec3 halfVector = normalize(sunDirection + viewDirection);
    float vellumSheen = pow(max(dot(normal, halfVector), 0.0), 26.0);
    float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.2);
    float reliefSlope = length(vec2(slopeEast, slopeNorth));
    float reliefOcclusion = mix(
      1.0,
      clamp(1.0 - reliefSlope * 8.5, 0.62, 1.0),
      reliefEnabled
    );

    float lonLine = 1.0 - smoothstep(0.02, 0.055, abs(fract(v_uv.x * 24.0 + u_time * 0.015) - 0.5));
    float latLine = 1.0 - smoothstep(0.02, 0.06, abs(fract(v_uv.y * 12.0) - 0.5));
    float grid = max(lonLine, latLine) * u_gridStrength * facing * directLight;

    float scanlineWave = sin(v_uv.y * u_scanlineDensity + u_time * 5.0 + v_uv.x * 12.0);
    float scanline = (0.5 + 0.5 * scanlineWave) * u_scanlineStrength * daylight * (1.0 - umbraShade);
    float slowScanlineStrength = u_scanlineStrength * u_slowScanlineStrength;
    vec3 earthAxis = vec3(0.0, 1.0, 0.0);
    vec3 slowScanlineAxis = normalize(earthAxis + vec3(0.22, 0.0, 0.08));
    float slowScanlineOffset = sin(u_time * 0.08) * 0.88;
    float slowScanlineDistance = abs(
      dot(sweepSurfaceNormal, slowScanlineAxis) - slowScanlineOffset
    );
    float slowScanlineCore = 1.0 - smoothstep(0.0, 0.065, slowScanlineDistance);
    float slowScanlineGlow = 1.0 - smoothstep(0.0, 0.19, slowScanlineDistance);
    float slowScanlineTail = 1.0 - smoothstep(0.0, 0.29, slowScanlineDistance);
    float slowScanline =
      (
        slowScanlineTail * 0.26 +
        slowScanlineGlow * 0.5 +
        slowScanlineCore * 0.76
      ) *
      slowScanlineStrength *
      (0.28 + daylight * 0.42) *
      (0.74 + facing * 0.18) *
      (1.0 - umbraShade * 0.68);

    float auroraWave = sin(v_uv.y * 18.0 - u_time * 0.9 + normal.x * 3.5);
    float aurora = smoothstep(0.15, 1.0, auroraWave) * u_auroraStrength * rim * daylight;

    float grain = (hash(v_uv * vec2(1024.0, 512.0) + u_time) - 0.5) * u_noiseStrength * (0.75 - umbraShade * 0.45);
    float parchmentSpeckle =
      (paperFiber - 0.5) * (0.06 + u_noiseStrength * 1.3) * u_surfaceTextureStrength;
    float reliefLight =
      (dot(reliefNormal, sunDirection) - dot(normalize(v_normal), sunDirection)) * reliefMask;
    float reliefHighlight = max(reliefLight, 0.0);
    float reliefShadow = min(reliefLight, 0.0);
    float atmosphere = u_atmosphereOpacity * (0.03 + directLight * 0.2 + rim * 0.18) * sunVisibility;
    float cityNightMask = clamp(
      nightBlend * (1.0 - rawSunVisibility * 0.97),
      0.0,
      1.0
    );
    float citySurfaceVisibility = 0.25 + 0.75 * pow(facing, 0.35);
    float atmosphericPath = 0.35 + pow(1.0 - facing, 1.8) * 1.1;
    vec3 cityEmission = vec3(0.0);
    vec3 pollutionEmission = vec3(0.0);

    if (u_useCityLights > 0.0 || u_useLightPollution > 0.0) {
      float cityRadiance = sampleCityLights(v_uv);
      float glowRadiance = sampleCityLightsGlow(v_uv);
      float pollutionRadiance = sampleCityLightsPollution(v_uv);
      float cityResponse = compressRadiance(cityRadiance, 448.0);
      float glowResponse = compressRadiance(glowRadiance, 320.0);
      float pollutionExposure = mix(116.0, 72.0, clamp(u_lightPollutionSpread / 3.5, 0.0, 1.0));
      float pollutionResponse = compressRadiance(pollutionRadiance, pollutionExposure);
      float normalizedCityLights = clamp(
        (cityResponse - u_cityLightsThreshold) /
        max(1.0 - u_cityLightsThreshold, 0.0001),
        0.0,
        1.0
      );
      float cityCoreSignal = pow(normalizedCityLights, 0.42);
      float cityGlowSignal = max(glowResponse - cityResponse * 0.22, 0.0);
      float pollutionField = max(pollutionResponse - cityResponse * 0.10, 0.0);
      float pollutionSignal = pow(pollutionField, 0.68);

      cityEmission =
        u_cityLightsColor *
        (
          cityCoreSignal * u_cityLightsIntensity +
          cityGlowSignal * u_cityLightsGlow * 1.8
        ) *
        cityNightMask *
        citySurfaceVisibility *
        u_useCityLights;
      pollutionEmission =
        u_lightPollutionColor *
        pow(pollutionSignal, 0.74) *
        u_lightPollutionIntensity *
        cityNightMask *
        atmosphericPath *
        (0.55 + 0.45 * citySurfaceVisibility) *
        u_useLightPollution;
    }

    vec3 color = shaded;
    color *= reliefOcclusion;
    float colorLuma = dot(color, vec3(0.299, 0.587, 0.114));
    vec3 desaturatedUmbra = mix(vec3(colorLuma), u_nightColor, 0.2);
    color = mix(color, desaturatedUmbra, umbraShade * 0.75);
    color *= 1.0 - umbraShade * 0.12;
    color += u_atmosphereTint * atmosphere;
    color += u_gridColor * (grid + scanline * 0.12 + slowScanline * 0.58);
    color +=
      u_atmosphereTint *
      (slowScanlineGlow * 0.56 + slowScanlineCore * 0.14) *
      slowScanlineStrength *
      0.085 *
      (0.28 + daylight * 0.34);
    color += u_rimLightColor * (rim + aurora);
    color += u_specularColor * specular;
    color += u_atmosphereTint * vellumSheen * (0.13 + fresnel * 0.22) * sunVisibility;
    color += vec3(0.08, 0.06, 0.03) * fresnel * (0.08 + daylight * 0.12) * sunVisibility;
    color += vec3(reliefHighlight) * (0.34 * sunVisibility);
    color += vec3(reliefShadow) * 0.24;
    color += parchmentSpeckle * (1.0 - umbraShade * 0.55);
    color += grain;
    color += pollutionEmission;
    color += cityEmission;

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

function createRotationMatrix(rotation: [number, number]) {
  const rotate = geoRotation([rotation[0], rotation[1], 0]);
  const xAxis = geoToSpherePosition(...rotate([90, 0]));
  const yAxis = geoToSpherePosition(...rotate([0, 90]));
  const zAxis = geoToSpherePosition(...rotate([180, 0]));

  return new Float32Array([
    xAxis.x,
    xAxis.y,
    xAxis.z,
    yAxis.x,
    yAxis.y,
    yAxis.z,
    zAxis.x,
    zAxis.y,
    zAxis.z,
  ]);
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

function withOpacity(color: string, opacity: number) {
  const parsed = parseCssColor(color);
  const alpha = Math.max(0, Math.min(1, opacity));
  return `rgba(${parsed.rgb[0]}, ${parsed.rgb[1]}, ${parsed.rgb[2]}, ${alpha})`;
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getScaledImageDimensions(
  image: HTMLImageElement,
  maxWidth: number,
) {
  const scale = Math.min(1, maxWidth / Math.max(image.naturalWidth, 1));

  return {
    height: Math.max(1, Math.round(image.naturalHeight * scale)),
    width: Math.max(1, Math.round(image.naturalWidth * scale)),
  };
}

function drawWrappedImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  for (let copy = 0; copy < 3; copy += 1) {
    context.drawImage(image, copy * width, 0, width, height);
  }
}

function buildWrappedBlurPassCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
  blurPx: number,
) {
  const sourceCanvas = createCanvas(width * 3, height);
  const sourceContext = sourceCanvas.getContext('2d');
  if (!sourceContext) {
    throw new Error('Failed to create city lights source canvas.');
  }

  drawWrappedImage(sourceContext, image, width, height);

  const blurredCanvas = createCanvas(width * 3, height);
  const blurredContext = blurredCanvas.getContext('2d');
  if (!blurredContext) {
    throw new Error('Failed to create city lights blur canvas.');
  }

  if (blurPx > 0) {
    blurredContext.filter = `blur(${blurPx}px)`;
  }
  blurredContext.drawImage(sourceCanvas, 0, 0);
  blurredContext.filter = 'none';

  const passCanvas = createCanvas(width, height);
  const passContext = passCanvas.getContext('2d');
  if (!passContext) {
    throw new Error('Failed to create city lights pass canvas.');
  }

  passContext.drawImage(blurredCanvas, width, 0, width, height, 0, 0, width, height);

  return passCanvas;
}

function getBloomPasses(radius: number) {
  return [
    {
      blurPx: Math.max(radius * 0.38, 0.55),
      opacity: 0.36,
    },
    {
      blurPx: Math.max(radius * 0.78, 0.95),
      opacity: 0.31,
    },
    {
      blurPx: Math.max(radius * 1.45, 1.45),
      opacity: 0.21,
    },
    {
      blurPx: Math.max(radius * 2.2, 2.2),
      opacity: 0.12,
    },
  ];
}

function buildCityLightsCompositeTextureCanvas(args: {
  image: HTMLImageElement;
  layers: Array<{
    opacity: number;
    radius: number;
  }>;
  maxWidth: number;
}) {
  const { image, layers, maxWidth } = args;
  const { height, width } = getScaledImageDimensions(image, maxWidth);
  const textureCanvas = createCanvas(width, height);
  const context = textureCanvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to create city lights texture canvas.');
  }

  for (const layer of layers) {
    const layerCanvas = createCanvas(width, height);
    const layerContext = layerCanvas.getContext('2d');
    if (!layerContext) {
      throw new Error('Failed to create city lights layer canvas.');
    }

    for (const pass of getBloomPasses(layer.radius)) {
      const passCanvas = buildWrappedBlurPassCanvas(
        image,
        width,
        height,
        pass.blurPx,
      );
      layerContext.save();
      layerContext.globalAlpha = pass.opacity;
      layerContext.drawImage(passCanvas, 0, 0);
      layerContext.restore();
    }

    context.save();
    context.globalAlpha = layer.opacity;
    context.drawImage(layerCanvas, 0, 0);
    context.restore();
  }

  return textureCanvas;
}

function prepareCityLightsMaps(
  image: HTMLImageElement,
  args: {
    cityLightsGlow: number;
    lightPollutionSpread: number;
  },
): PreparedCityLightsMaps {
  return {
    glow: buildCityLightsCompositeTextureCanvas({
      image,
      layers: [
        {
          opacity: 1,
          radius: 0.85 + args.cityLightsGlow * 1.1,
        },
      ],
      maxWidth: 1024,
    }),
    pollution: buildCityLightsCompositeTextureCanvas({
      image,
      layers: [
        {
          opacity: 0.52,
          radius: 2.6 + args.lightPollutionSpread * 3.1,
        },
        {
          opacity: 0.48,
          radius: 5.2 + args.lightPollutionSpread * 5.1,
        },
      ],
      maxWidth: 768,
    }),
  };
}

function isHydroFeatureCollection(value: unknown): value is HydroFeatureCollection {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as {
    features?: unknown;
    type?: unknown;
  };
  return candidate.type === 'FeatureCollection' && Array.isArray(candidate.features);
}

async function loadHydroFeatureCollection(path: string) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load hydro layer: ${path}`);
  }

  const data: unknown = await response.json();
  if (!isHydroFeatureCollection(data)) {
    throw new Error(`Invalid hydro layer: ${path}`);
  }

  return data;
}

function drawFeatureFills(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  fillStyle: string,
) {
  context.fillStyle = fillStyle;

  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.fill();
  }
}

function drawFeatureStrokes(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  strokeStyle: string,
  lineWidth: number,
) {
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;

  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
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

function applyAtlasParchmentAging(
  context: CanvasRenderingContext2D,
  textureCanvas: HTMLCanvasElement,
  palette: GlobePalette,
) {
  const { width, height } = textureCanvas;
  context.save();

  const edgeDarken = context.createRadialGradient(
    width * 0.5,
    height * 0.5,
    width * 0.12,
    width * 0.5,
    height * 0.5,
    width * 0.78,
  );
  edgeDarken.addColorStop(0, shiftColor(palette.oceanFill, 0, 0, 0, 0));
  edgeDarken.addColorStop(1, 'rgba(88, 55, 21, 0.28)');
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = edgeDarken;
  context.fillRect(0, 0, width, height);

  const warmBloom = context.createRadialGradient(
    width * 0.42,
    height * 0.37,
    width * 0.06,
    width * 0.42,
    height * 0.37,
    width * 0.65,
  );
  warmBloom.addColorStop(0, 'rgba(251, 234, 194, 0.18)');
  warmBloom.addColorStop(1, 'rgba(210, 173, 118, 0)');
  context.globalCompositeOperation = 'screen';
  context.fillStyle = warmBloom;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = 'multiply';
  for (let index = 0; index < 26; index += 1) {
    const x = ((index * 197) % width) + (index % 5) * 7;
    const y = ((index * 131) % height) + (index % 4) * 9;
    const radius = width * (0.0015 + (index % 3) * 0.0006);
    const blot = context.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    blot.addColorStop(0, 'rgba(112, 74, 35, 0.07)');
    blot.addColorStop(0.65, 'rgba(151, 103, 52, 0.03)');
    blot.addColorStop(1, 'rgba(169, 131, 82, 0)');
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'multiply';
  context.globalAlpha = 0.18;
  context.strokeStyle = 'rgba(118, 80, 40, 0.35)';
  context.lineWidth = Math.max(width / 4200, 0.35);
  for (let fold = 0; fold < 3; fold += 1) {
    const x = width * (0.2 + fold * 0.3);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + (fold - 1) * 8, height);
    context.stroke();
  }

  context.restore();
}

function applyAtlasSatelliteWatercolor(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  textureCanvas: HTMLCanvasElement,
  palette: GlobePalette,
  atlasImageryImage: HTMLImageElement | null,
) {
  if (!atlasImageryImage) {
    return;
  }

  const { width, height } = textureCanvas;
  const imageryCanvas = document.createElement('canvas');
  imageryCanvas.width = width;
  imageryCanvas.height = height;
  const imageryContext = imageryCanvas.getContext('2d');
  if (!imageryContext) {
    return;
  }

  imageryContext.drawImage(atlasImageryImage, 0, 0, width, height);
  const imageryData = imageryContext.getImageData(0, 0, width, height);
  const pixels = imageryData.data;
  const levels = 8;

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index] ?? 0;
    const green = pixels[index + 1] ?? 0;
    const blue = pixels[index + 2] ?? 0;
    const x = (index / 4) % width;
    const y = Math.floor(index / 4 / width);
    const luma = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;
    const posterized = Math.round(luma * (levels - 1)) / (levels - 1);
    const pigmentNoise =
      (Math.sin(x * 0.053 + y * 0.031) + Math.sin(x * 0.11 - y * 0.046)) *
      0.018;
    const paperMapped = Math.max(0, Math.min(1, posterized + pigmentNoise));
    const ink = Math.pow(paperMapped, 0.92);

    pixels[index] = Math.round(ink * 244);
    pixels[index + 1] = Math.round(ink * 231);
    pixels[index + 2] = Math.round(ink * 202);
    pixels[index + 3] = 255;
  }

  imageryContext.putImageData(imageryData, 0, 0);

  context.save();

  context.globalAlpha = 0.34;
  context.globalCompositeOperation = 'multiply';
  context.drawImage(imageryCanvas, 0, 0);

  context.globalCompositeOperation = 'soft-light';
  context.fillStyle = shiftColor(palette.oceanFill, 8, 12, 14, 0.38);
  context.fillRect(0, 0, width, height);

  context.save();
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
  }
  context.clip();

  context.globalCompositeOperation = 'multiply';
  context.globalAlpha = 0.72;
  context.drawImage(imageryCanvas, 0, 0);
  context.fillStyle = shiftColor(palette.countryFill, -8, -4, -3, 0.3);
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'soft-light';
  context.globalAlpha = 0.32;
  context.fillStyle = shiftColor(palette.countryFill, 20, 18, 8, 0.34);
  context.fillRect(0, 0, width, height);

  context.restore();
  context.restore();
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function shiftColor(
  color: string,
  redShift: number,
  greenShift: number,
  blueShift: number,
  alphaOverride?: number,
) {
  const parsed = parseCssColor(color);
  const alpha = alphaOverride ?? parsed.alpha;
  return `rgba(${clampChannel(parsed.rgb[0] + redShift)}, ${clampChannel(
    parsed.rgb[1] + greenShift,
  )}, ${clampChannel(parsed.rgb[2] + blueShift)}, ${Math.max(
    0,
    Math.min(1, alpha),
  )})`;
}

function applyAtlasWatercolorOcean(
  context: CanvasRenderingContext2D,
  textureCanvas: HTMLCanvasElement,
  palette: GlobePalette,
) {
  const { width, height } = textureCanvas;
  context.save();

  const wash = context.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, shiftColor(palette.oceanFill, -8, -6, -2, 0.38));
  wash.addColorStop(0.5, shiftColor(palette.oceanFill, 7, 10, 14, 0.22));
  wash.addColorStop(1, shiftColor(palette.oceanFill, -10, -10, -6, 0.36));
  context.fillStyle = wash;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = 'multiply';
  for (let index = 0; index < 24; index += 1) {
    const x = ((index * 227) % width) + (index % 3) * 17;
    const y = ((index * 139) % height) + (index % 5) * 11;
    const radius = width * (0.035 + (index % 7) * 0.004);
    const blot = context.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    blot.addColorStop(0, shiftColor(palette.oceanFill, -20, -14, -10, 0.09));
    blot.addColorStop(1, shiftColor(palette.oceanFill, 8, 10, 14, 0));
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'soft-light';
  for (let index = 0; index < 18; index += 1) {
    const x = ((index * 193) % width) + 8;
    const y = ((index * 101) % height) + 6;
    const radius = width * (0.022 + (index % 5) * 0.003);
    const blot = context.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    blot.addColorStop(0, shiftColor(palette.oceanFill, 18, 22, 30, 0.11));
    blot.addColorStop(1, shiftColor(palette.oceanFill, 0, 0, 0, 0));
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

function applyAtlasOceanCurrentHatching(
  context: CanvasRenderingContext2D,
  textureCanvas: HTMLCanvasElement,
) {
  const { width, height } = textureCanvas;
  const spacing = Math.max(Math.floor(height / 24), 14);

  context.save();
  context.globalAlpha = 0.22;
  context.strokeStyle = 'rgba(98, 121, 124, 0.24)';
  context.lineWidth = Math.max(width / 4600, 0.4);

  for (let y = -spacing; y <= height + spacing; y += spacing) {
    context.beginPath();
    for (let x = 0; x <= width; x += 24) {
      const wave =
        Math.sin((x / width) * Math.PI * 4.0 + y * 0.02) * 2.4 +
        Math.sin((x / width) * Math.PI * 11.0 + y * 0.011) * 0.9;
      const py = y + wave;
      if (x === 0) {
        context.moveTo(x, py);
      } else {
        context.lineTo(x, py);
      }
    }
    context.stroke();
  }

  context.globalAlpha = 0.13;
  context.strokeStyle = 'rgba(240, 233, 205, 0.2)';
  context.lineWidth = Math.max(width / 5400, 0.3);
  for (let y = spacing / 2; y <= height + spacing; y += spacing) {
    context.beginPath();
    for (let x = 0; x <= width; x += 24) {
      const wave = Math.sin((x / width) * Math.PI * 5.0 + y * 0.018) * 1.8;
      const py = y + wave;
      if (x === 0) {
        context.moveTo(x, py);
      } else {
        context.lineTo(x, py);
      }
    }
    context.stroke();
  }

  context.restore();
}

function applyAtlasWatercolorLand(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  textureCanvas: HTMLCanvasElement,
  palette: GlobePalette,
) {
  const { width, height } = textureCanvas;

  context.save();
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
  }
  context.clip();

  const landWash = context.createLinearGradient(0, 0, width, height);
  landWash.addColorStop(0, shiftColor(palette.countryFill, 16, 14, 6, 0.2));
  landWash.addColorStop(0.5, shiftColor(palette.countryFill, -8, -10, -4, 0.16));
  landWash.addColorStop(1, shiftColor(palette.countryFill, 8, 8, 3, 0.18));
  context.fillStyle = landWash;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = 'multiply';
  for (let index = 0; index < 28; index += 1) {
    const x = ((index * 181) % width) + (index % 4) * 9;
    const y = ((index * 127) % height) + (index % 6) * 7;
    const radius = width * (0.028 + (index % 6) * 0.004);
    const blot = context.createRadialGradient(x, y, radius * 0.15, x, y, radius);
    blot.addColorStop(0, shiftColor(palette.countryFill, -20, -16, -8, 0.08));
    blot.addColorStop(1, shiftColor(palette.countryFill, 2, 2, 1, 0));
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'soft-light';
  for (let index = 0; index < 20; index += 1) {
    const x = ((index * 149) % width) + 5;
    const y = ((index * 113) % height) + 5;
    const radius = width * (0.016 + (index % 5) * 0.0035);
    const blot = context.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    blot.addColorStop(0, shiftColor(palette.countryFill, 24, 22, 12, 0.1));
    blot.addColorStop(1, shiftColor(palette.countryFill, 0, 0, 0, 0));
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

function applyAtlasInkBleed(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  textureCanvas: HTMLCanvasElement,
) {
  context.save();
  context.globalAlpha = 0.18;
  context.strokeStyle = 'rgba(70, 42, 18, 0.42)';
  context.lineWidth = Math.max(textureCanvas.width / 2300, 0.8);
  context.shadowColor = 'rgba(61, 35, 14, 0.35)';
  context.shadowBlur = Math.max(textureCanvas.width / 480, 2.4);
  context.shadowOffsetX = 0;
  context.shadowOffsetY = Math.max(textureCanvas.width / 4096, 0.45);
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.stroke();
  }
  context.restore();
}

function applyAtlasInkCoastline(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  textureCanvas: HTMLCanvasElement,
) {
  context.save();
  context.globalAlpha = 0.9;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.strokeStyle = 'rgba(78, 46, 20, 0.58)';
  context.lineWidth = Math.max(textureCanvas.width / 2048, 0.95);
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.stroke();
  }

  context.globalAlpha = 0.45;
  context.strokeStyle = 'rgba(244, 231, 198, 0.46)';
  context.lineWidth = Math.max(textureCanvas.width / 4096, 0.45);
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.stroke();
  }
  context.restore();
}

function applyAtlasCoastalWash(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  textureCanvas: HTMLCanvasElement,
  palette: GlobePalette,
) {
  context.save();

  context.globalAlpha = 0.34;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.strokeStyle = shiftColor(palette.oceanFill, 22, 24, 28, 0.36);
  context.lineWidth = Math.max(textureCanvas.width / 540, 3.2);
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.stroke();
  }

  context.globalAlpha = 0.25;
  context.strokeStyle = shiftColor(palette.oceanFill, -12, -10, -6, 0.32);
  context.lineWidth = Math.max(textureCanvas.width / 900, 1.9);
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.stroke();
  }

  context.restore();
}

function applyAtlasLandHachure(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  textureCanvas: HTMLCanvasElement,
) {
  const { width, height } = textureCanvas;
  const spacing = Math.max(Math.floor(width / 96), 14);

  context.save();
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
  }
  context.clip();

  context.globalAlpha = 0.2;
  context.strokeStyle = 'rgba(93, 58, 28, 0.24)';
  context.lineWidth = Math.max(width / 3072, 0.5);
  for (let offset = -height; offset < width + height; offset += spacing) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset - height, height);
    context.stroke();
  }

  context.globalAlpha = 0.11;
  context.strokeStyle = 'rgba(244, 229, 198, 0.22)';
  context.lineWidth = Math.max(width / 4096, 0.4);
  for (let offset = -height + spacing / 2; offset < width + height; offset += spacing) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset - height, height);
    context.stroke();
  }

  context.restore();
}

function buildOceanTextureCanvas(
  world: FeatureCollectionLike,
  palette: GlobePalette,
  textureSize: number,
  isAtlas: boolean,
  atlasPaperImage: HTMLImageElement | null,
  atlasImageryImage: HTMLImageElement | null,
) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = textureSize;
  textureCanvas.height = textureSize / 2;

  withTextureContext(textureCanvas, (context) => {
    context.fillStyle = palette.oceanFill;
    context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
    if (isAtlas) {
      const projection = geoEquirectangular()
        .translate([textureCanvas.width / 2, textureCanvas.height / 2])
        .scale(textureCanvas.width / (2 * Math.PI));
      const path = geoPath(projection, context);
      applyAtlasSatelliteWatercolor(
        context,
        path,
        world,
        textureCanvas,
        palette,
        atlasImageryImage,
      );
      applyAtlasWatercolorOcean(context, textureCanvas, palette);
      applyAtlasOceanCurrentHatching(context, textureCanvas);
    }
    applyAtlasPaperTexture(context, textureCanvas, atlasPaperImage);
    if (isAtlas) {
      applyAtlasParchmentAging(context, textureCanvas, palette);
    }

    if (isAtlas) {
      const projection = geoEquirectangular()
        .translate([textureCanvas.width / 2, textureCanvas.height / 2])
        .scale(textureCanvas.width / (2 * Math.PI));
      const path = geoPath(projection, context);
      applyAtlasCoastalWash(context, path, world, textureCanvas, palette);
      applyAtlasInkCoastline(context, path, world, textureCanvas);
      applyAtlasInkBleed(context, path, world, textureCanvas);
    }

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

function drawHydroLayers(args: {
  context: CanvasRenderingContext2D;
  lakesData: HydroFeatureCollection | null;
  path: ReturnType<typeof geoPath>;
  quality: GlobeQualityConfig;
  riversData: HydroFeatureCollection | null;
  textureCanvas: HTMLCanvasElement;
}) {
  const { context, lakesData, path, quality, riversData, textureCanvas } = args;

  if (quality.showLakes && lakesData) {
    context.fillStyle = withOpacity(quality.lakesColor, quality.lakesOpacity);
    for (const feature of lakesData.features) {
      context.beginPath();
      path(feature as GeoPermissibleObjects);
      context.fill();
    }
  }

  if (quality.showRivers && riversData) {
    context.globalAlpha = Math.max(0, Math.min(1, quality.riversOpacity));
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = Math.max(
      textureCanvas.width / 4096,
      quality.riversWidth,
    );
    context.strokeStyle = quality.riversColor;
    for (const feature of riversData.features) {
      context.beginPath();
      path(feature as GeoPermissibleObjects);
      context.stroke();
    }
    context.globalAlpha = 1;
  }
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
  quality: GlobeQualityConfig,
  textureSize: number,
  isAtlas: boolean,
  atlasPaperImage: HTMLImageElement | null,
  atlasImageryImage: HTMLImageElement | null,
  lakesData: HydroFeatureCollection | null,
  riversData: HydroFeatureCollection | null,
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
      applyAtlasSatelliteWatercolor(
        context,
        path,
        world,
        textureCanvas,
        palette,
        atlasImageryImage,
      );
      applyAtlasWatercolorOcean(context, textureCanvas, palette);
      applyAtlasOceanCurrentHatching(context, textureCanvas);
      applyAtlasPaperTexture(context, textureCanvas, atlasPaperImage);
      applyAtlasParchmentAging(context, textureCanvas, palette);
    }

    if (isAtlas) {
      drawAtlasExpeditionDetails(context, path, textureCanvas);
    }

    if (isAtlas) {
      applyAtlasWatercolorLand(context, path, world, textureCanvas, palette);
      applyAtlasLandHachure(context, path, world, textureCanvas);
      applyAtlasCoastalWash(context, path, world, textureCanvas, palette);
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
    drawFeatureFills(
      context,
      path,
      world,
      palette.countryFill,
    );
    drawHydroLayers({
      context,
      lakesData,
      path,
      quality,
      riversData,
      textureCanvas,
    });
    drawFeatureStrokes(
      context,
      path,
      world,
      palette.countryStroke,
      isAtlas ? 1.4 : 1.2,
    );
    if (isAtlas) {
      applyAtlasInkCoastline(context, path, world, textureCanvas);
      applyAtlasInkBleed(context, path, world, textureCanvas);
    }
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
  quality: GlobeQualityConfig,
  textureSize: number,
  isAtlas: boolean,
  atlasPaperImage: HTMLImageElement | null,
  atlasImageryImage: HTMLImageElement | null,
  lakesData: HydroFeatureCollection | null,
  riversData: HydroFeatureCollection | null,
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
      applyAtlasSatelliteWatercolor(
        context,
        path,
        world,
        textureCanvas,
        palette,
        atlasImageryImage,
      );
      applyAtlasWatercolorOcean(context, textureCanvas, palette);
      applyAtlasOceanCurrentHatching(context, textureCanvas);
      applyAtlasPaperTexture(context, textureCanvas, atlasPaperImage);
      applyAtlasParchmentAging(context, textureCanvas, palette);
    }
    if (isAtlas) {
      drawAtlasExpeditionDetails(context, path, textureCanvas);
    }
    if (isAtlas) {
      applyAtlasWatercolorLand(context, path, world, textureCanvas, palette);
      applyAtlasLandHachure(context, path, world, textureCanvas);
      applyAtlasCoastalWash(context, path, world, textureCanvas, palette);
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

    drawFeatureFills(
      context,
      path,
      world,
      palette.countryFill,
    );
    drawHydroLayers({
      context,
      lakesData,
      path,
      quality,
      riversData,
      textureCanvas,
    });
    drawFeatureStrokes(
      context,
      path,
      world,
      palette.countryStroke,
      isAtlas ? 1.4 : 1.2,
    );
    if (isAtlas) {
      applyAtlasInkCoastline(context, path, world, textureCanvas);
      applyAtlasInkBleed(context, path, world, textureCanvas);
    }
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

function isPowerOfTwo(value: number) {
  return value > 0 && (value & (value - 1)) === 0;
}

function configureTexture(
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

function initializeWebGl(canvas: HTMLCanvasElement): WebGlResources {
  const gl =
    canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      desynchronized: true,
      powerPreference: 'high-performance',
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
    atmosphereOpacity: getUniformLocation(gl, program, 'u_atmosphereOpacity'),
    atmosphereTint: getUniformLocation(gl, program, 'u_atmosphereTint'),
    auroraStrength: getUniformLocation(gl, program, 'u_auroraStrength'),
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
    rimLightColor: getUniformLocation(gl, program, 'u_rimLightColor'),
    rimLightStrength: getUniformLocation(gl, program, 'u_rimLightStrength'),
    rotationMatrix: getUniformLocation(gl, program, 'u_rotationMatrix'),
    scale: getUniformLocation(gl, program, 'u_scale'),
    scanlineDensity: getUniformLocation(gl, program, 'u_scanlineDensity'),
    slowScanlineStrength: getUniformLocation(
      gl,
      program,
      'u_slowScanlineStrength',
    ),
    scanlineStrength: getUniformLocation(gl, program, 'u_scanlineStrength'),
    specularColor: getUniformLocation(gl, program, 'u_specularColor'),
    specularPower: getUniformLocation(gl, program, 'u_specularPower'),
    specularStrength: getUniformLocation(gl, program, 'u_specularStrength'),
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
    umbraDarkness: getUniformLocation(gl, program, 'u_umbraDarkness'),
    useCityLights: getUniformLocation(gl, program, 'u_useCityLights'),
    useDayImagery: getUniformLocation(gl, program, 'u_useDayImagery'),
    useLightPollution: getUniformLocation(
      gl,
      program,
      'u_useLightPollution',
    ),
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

function drawGlobe(
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
  const rotationMatrix = createRotationMatrix(currentRotation);
  const sunDirection = getRotatedSunDirection(currentRotation);
  const [atmosphereRed, atmosphereGreen, atmosphereBlue] = cssColorToVec3(
    palette.atmosphereTint,
  );
  const [cityLightsRed, cityLightsGreen, cityLightsBlue] = cssColorToVec3(
    quality.cityLightsColor,
  );
  const [gridRed, gridGreen, gridBlue] = cssColorToVec3(palette.gridColor);
  const [
    lightPollutionRed,
    lightPollutionGreen,
    lightPollutionBlue,
  ] = cssColorToVec3(quality.lightPollutionColor);
  const { alpha: nightAlpha, rgb: nightRgb } = parseCssColor(palette.nightShade);
  const [rimRed, rimGreen, rimBlue] = cssColorToVec3(palette.rimLightColor);
  const [specularRed, specularGreen, specularBlue] = cssColorToVec3(
    palette.specularColor,
  );
  const hasRaisedCountries = palette.countryElevation > 0;

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(resources.program);
  gl.uniform3f(
    uniforms.cityLightsColor,
    cityLightsRed,
    cityLightsGreen,
    cityLightsBlue,
  );
  gl.uniform1f(uniforms.cityLightsGlow, quality.cityLightsGlow);
  gl.uniform1f(uniforms.cityLightsIntensity, quality.cityLightsIntensity);
  gl.uniform1f(uniforms.cityLightsThreshold, quality.cityLightsThreshold);
  gl.uniform1f(uniforms.reliefStrength, reliefStrength);
  gl.uniform1f(uniforms.umbraDarkness, quality.umbraDarkness);
  gl.uniform2f(uniforms.reliefTexelSize, reliefTexelSize[0], reliefTexelSize[1]);
  gl.uniform3f(
    uniforms.lightPollutionColor,
    lightPollutionRed,
    lightPollutionGreen,
    lightPollutionBlue,
  );
  gl.uniform1f(
    uniforms.lightPollutionIntensity,
    quality.lightPollutionIntensity,
  );
  gl.uniform1f(
    uniforms.lightPollutionSpread,
    quality.lightPollutionSpread,
  );
  gl.uniform1f(uniforms.useCityLights, quality.cityLightsEnabled ? 1 : 0);
  gl.uniform1f(uniforms.useDayImagery, quality.dayImageryEnabled ? 1 : 0);
  gl.uniform1f(
    uniforms.useLightPollution,
    quality.lightPollutionEnabled ? 1 : 0,
  );
  gl.uniform1f(uniforms.useNightImagery, quality.nightImageryEnabled ? 1 : 0);
  gl.uniform1f(uniforms.useWaterMask, quality.waterMaskEnabled ? 1 : 0);
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
  gl.uniformMatrix3fv(uniforms.rotationMatrix, false, rotationMatrix);
  gl.uniform2f(uniforms.scale, scaleX, scaleY);
  gl.uniform1f(uniforms.penumbra, getTerminatorHalfAngleRadians());
  gl.uniform3f(uniforms.rimLightColor, rimRed, rimGreen, rimBlue);
  gl.uniform1f(uniforms.rimLightStrength, palette.rimLightStrength);
  gl.uniform1f(uniforms.scanlineDensity, palette.scanlineDensity);
  gl.uniform1f(uniforms.scanlineStrength, palette.scanlineStrength);
  gl.uniform1f(uniforms.slowScanlineStrength, slowScanlineStrength);
  gl.uniform1f(
    uniforms.surfaceDistortionStrength,
    palette.surfaceDistortionStrength,
  );
  gl.uniform1f(
    uniforms.surfaceTextureStrength,
    palette.surfaceTextureStrength,
  );
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
  quality,
  themeId,
}: WebGlGlobeProps) {
  const isAtlas = themeId === 'atlas';
  const slowScanlineStrength = themeId === 'cipher' ? 1 : 0;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const resourcesRef = useRef<WebGlResources | null>(null);
  const drawCurrentFrameRef = useRef<
    (now?: number, includeOverlay?: boolean) => void
  >(() => undefined);
  const targetFeatureRef = useRef<CountryFeature>(country);
  const lakesDataRef = useRef<HydroFeatureCollection | null>(null);
  const riversDataRef = useRef<HydroFeatureCollection | null>(null);
  const frameStateRef = useRef({
    currentRotation: rotation,
    height,
    width,
    zoomScale: 1,
  });
  const paletteRef = useRef(palette);
  const qualityRef = useRef(quality);
  const [atlasPaperImage, setAtlasPaperImage] =
    useState<HTMLImageElement | null>(null);
  const [atlasImageryImage, setAtlasImageryImage] =
    useState<HTMLImageElement | null>(null);
  const [cityLightsImage, setCityLightsImage] =
    useState<HTMLImageElement | null>(null);
  const [preparedCityLightsMaps, setPreparedCityLightsMaps] =
    useState<PreparedCityLightsMaps | null>(null);
  const [dayImageryImage, setDayImageryImage] =
    useState<HTMLImageElement | null>(null);
  const [nightImageryImage, setNightImageryImage] =
    useState<HTMLImageElement | null>(null);
  const [reliefImage, setReliefImage] = useState<HTMLImageElement | null>(null);
  const [waterMaskImage, setWaterMaskImage] = useState<HTMLImageElement | null>(
    null,
  );
  const [lakesData, setLakesData] = useState<HydroFeatureCollection | null>(null);
  const [riversData, setRiversData] = useState<HydroFeatureCollection | null>(null);
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
    qualityRef.current = quality;
  }, [quality]);

  useEffect(() => {
    targetFeatureRef.current = targetFeature;
  }, [targetFeature]);

  useEffect(() => {
    lakesDataRef.current = lakesData;
  }, [lakesData]);

  useEffect(() => {
    riversDataRef.current = riversData;
  }, [riversData]);

  useEffect(() => {
    if (!quality.reliefMapEnabled) {
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (!cancelled) {
        setReliefImage(image);
      }
    };
    image.onerror = () => {
      if (!cancelled) {
        setReliefImage(null);
      }
    };
    image.src = '/textures/world-relief.png';

    return () => {
      cancelled = true;
    };
  }, [quality.reliefMapEnabled]);

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

  useEffect(() => {
    if (!isAtlas) {
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (!cancelled) {
        setAtlasImageryImage(image);
      }
    };
    image.onerror = () => {
      if (!cancelled) {
        setAtlasImageryImage(null);
      }
    };
    image.src = '/textures/world-imagery.jpg';

    return () => {
      cancelled = true;
    };
  }, [isAtlas]);

  useEffect(() => {
    if (!quality.cityLightsEnabled && !quality.lightPollutionEnabled) {
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (!cancelled) {
        setCityLightsImage(image);
      }
    };
    image.onerror = () => {
      if (!cancelled) {
        setCityLightsImage(null);
      }
    };
    image.src = '/textures/world-city-lights.jpg';

    return () => {
      cancelled = true;
    };
  }, [quality.cityLightsEnabled, quality.lightPollutionEnabled]);

  useEffect(() => {
    if (!quality.dayImageryEnabled) {
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (!cancelled) {
        setDayImageryImage(image);
      }
    };
    image.onerror = () => {
      if (!cancelled) {
        setDayImageryImage(null);
      }
    };
    image.src = '/textures/world-imagery.jpg';

    return () => {
      cancelled = true;
    };
  }, [quality.dayImageryEnabled]);

  useEffect(() => {
    if (!quality.nightImageryEnabled) {
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (!cancelled) {
        setNightImageryImage(image);
      }
    };
    image.onerror = () => {
      if (!cancelled) {
        setNightImageryImage(null);
      }
    };
    image.src = '/textures/world-night.jpg';

    return () => {
      cancelled = true;
    };
  }, [quality.nightImageryEnabled]);

  useEffect(() => {
    if (!quality.waterMaskEnabled) {
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (!cancelled) {
        setWaterMaskImage(image);
      }
    };
    image.onerror = () => {
      if (!cancelled) {
        setWaterMaskImage(null);
      }
    };
    image.src = '/textures/world-water-mask.png';

    return () => {
      cancelled = true;
    };
  }, [quality.waterMaskEnabled]);

  useEffect(() => {
    if (!quality.showLakes || lakesDataRef.current) {
      return;
    }

    let cancelled = false;
    void loadHydroFeatureCollection('/data/ne-110m-lakes.geojson')
      .then((data) => {
        if (!cancelled) {
          setLakesData(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLakesData(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [quality.showLakes]);

  useEffect(() => {
    if (!quality.showRivers || riversDataRef.current) {
      return;
    }

    let cancelled = false;
    void loadHydroFeatureCollection('/data/ne-110m-rivers.geojson')
      .then((data) => {
        if (!cancelled) {
          setRiversData(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRiversData(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [quality.showRivers]);

  useEffect(() => {
    if (
      !cityLightsImage ||
      (!quality.cityLightsEnabled && !quality.lightPollutionEnabled)
    ) {
      const timeoutId = window.setTimeout(() => {
        setPreparedCityLightsMaps(null);
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      try {
        setPreparedCityLightsMaps(
          prepareCityLightsMaps(cityLightsImage, {
            cityLightsGlow: quality.cityLightsGlow,
            lightPollutionSpread: quality.lightPollutionSpread,
          }),
        );
      } catch {
        setPreparedCityLightsMaps(null);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    cityLightsImage,
    quality.cityLightsEnabled,
    quality.cityLightsGlow,
    quality.lightPollutionEnabled,
    quality.lightPollutionSpread,
  ]);

  const drawOverlayFrame = useCallback((now = performance.now()) => {
    const overlayCanvas = overlayCanvasRef.current;
    const frameState = frameStateRef.current;

    if (!overlayCanvas) {
      return;
    }

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

  const drawCurrentFrame = useCallback((
    now = performance.now(),
    includeOverlay = true,
  ) => {
    const canvas = canvasRef.current;
    const resources = resourcesRef.current;
    const frameState = frameStateRef.current;

    if (!canvas || !resources) {
      return;
    }

    const currentQuality = qualityRef.current;
    const baseReliefStrength = isAtlas ? 16 : 8;
    const reliefStrength = currentQuality.reliefMapEnabled
      ? baseReliefStrength * currentQuality.reliefHeight
      : 0;

    drawGlobe(
      resources,
      canvas,
      frameState.width,
      frameState.height,
      frameState.zoomScale,
      frameState.currentRotation,
      paletteRef.current,
      currentQuality,
      slowScanlineStrength,
      now * 0.001,
      reliefStrength,
      reliefImage
        ? [1 / reliefImage.naturalWidth, 1 / reliefImage.naturalHeight]
        : [1 / 2048, 1 / 1024],
    );

    if (includeOverlay) {
      drawOverlayFrame(now);
    }
  }, [drawOverlayFrame, isAtlas, reliefImage, slowScanlineStrength]);

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
          isAtlas ? atlasImageryImage : null,
        )
      : buildCombinedTextureCanvas(
          world,
          null,
          palette,
          quality,
          textureResolution,
          isAtlas,
          isAtlas ? atlasPaperImage : null,
          isAtlas ? atlasImageryImage : null,
          lakesData,
          riversData,
        );
    const countryTextureCanvas = hasRaisedCountries
      ? buildCountryTextureCanvas(
          world,
          null,
          palette,
          quality,
          textureResolution,
          isAtlas,
          isAtlas ? atlasPaperImage : null,
          isAtlas ? atlasImageryImage : null,
          lakesData,
          riversData,
        )
      : null;
    gl.activeTexture(gl.TEXTURE0);
    configureTexture(
      gl,
      resources.texture,
      baseTextureCanvas.width,
      baseTextureCanvas.height,
    );
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
      configureTexture(
        gl,
        resources.overlayTexture,
        countryTextureCanvas.width,
        countryTextureCanvas.height,
      );
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

    if (reliefImage) {
      gl.activeTexture(gl.TEXTURE1);
      configureTexture(
        gl,
        resources.reliefTexture,
        reliefImage.naturalWidth,
        reliefImage.naturalHeight,
      );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        reliefImage,
      );
      gl.activeTexture(gl.TEXTURE0);
    }

    if (cityLightsImage) {
      gl.activeTexture(gl.TEXTURE2);
      configureTexture(
        gl,
        resources.cityLightsTexture,
        cityLightsImage.naturalWidth,
        cityLightsImage.naturalHeight,
      );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        cityLightsImage,
      );
      gl.activeTexture(gl.TEXTURE0);
    }

    if (preparedCityLightsMaps) {
      gl.activeTexture(gl.TEXTURE3);
      configureTexture(
        gl,
        resources.cityLightsGlowTexture,
        preparedCityLightsMaps.glow.width,
        preparedCityLightsMaps.glow.height,
      );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        preparedCityLightsMaps.glow,
      );

      gl.activeTexture(gl.TEXTURE4);
      configureTexture(
        gl,
        resources.cityLightsPollutionTexture,
        preparedCityLightsMaps.pollution.width,
        preparedCityLightsMaps.pollution.height,
      );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        preparedCityLightsMaps.pollution,
      );
      gl.activeTexture(gl.TEXTURE0);
    }

    if (dayImageryImage) {
      gl.activeTexture(gl.TEXTURE5);
      configureTexture(
        gl,
        resources.dayTexture,
        dayImageryImage.naturalWidth,
        dayImageryImage.naturalHeight,
      );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        dayImageryImage,
      );
      gl.activeTexture(gl.TEXTURE0);
    }

    if (nightImageryImage) {
      gl.activeTexture(gl.TEXTURE6);
      configureTexture(
        gl,
        resources.nightTexture,
        nightImageryImage.naturalWidth,
        nightImageryImage.naturalHeight,
      );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        nightImageryImage,
      );
      gl.activeTexture(gl.TEXTURE0);
    }

    if (waterMaskImage) {
      gl.activeTexture(gl.TEXTURE7);
      configureTexture(
        gl,
        resources.waterMaskTexture,
        waterMaskImage.naturalWidth,
        waterMaskImage.naturalHeight,
      );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        waterMaskImage,
      );
      gl.activeTexture(gl.TEXTURE0);
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
    atlasImageryImage,
    atlasPaperImage,
    cityLightsImage,
    dayImageryImage,
    drawCurrentFrame,
    height,
    isAtlas,
    lakesData,
    nightImageryImage,
    palette,
    preparedCityLightsMaps,
    quality,
    reliefImage,
    riversData,
    waterMaskImage,
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
      drawCurrentFrame(now, hasCapitalBlipAnimation);
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
