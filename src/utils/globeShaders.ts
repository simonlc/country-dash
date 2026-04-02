export const vertexShaderSource = `
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

export const fragmentShaderSource = `
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
  uniform float u_twilightPenumbra;
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
    vec3 north = normalize(
      vec3(-sin(lon) * sin(lat), cos(lat), cos(lon) * sin(lat))
    );
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
    float twilight =
      smoothstep(u_twilightPenumbra, -u_twilightPenumbra, light) *
      u_nightAlpha;
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
    float rim =
      pow(1.0 - facing, 2.5) *
      u_rimLightStrength *
      (0.22 + daylight * 0.48) *
      sunVisibility;
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

    float lonLine = 1.0 - smoothstep(
      0.02,
      0.055,
      abs(fract(v_uv.x * 24.0 + u_time * 0.015) - 0.5)
    );
    float latLine = 1.0 - smoothstep(
      0.02,
      0.06,
      abs(fract(v_uv.y * 12.0) - 0.5)
    );
    float grid = max(lonLine, latLine) * u_gridStrength * facing * directLight;

    float scanlineWave =
      sin(v_uv.y * u_scanlineDensity + u_time * 5.0 + v_uv.x * 12.0);
    float scanline =
      (0.5 + 0.5 * scanlineWave) *
      u_scanlineStrength *
      daylight *
      (1.0 - umbraShade);
    float slowScanlineStrength = u_scanlineStrength * u_slowScanlineStrength;
    vec3 earthAxis = vec3(0.0, 1.0, 0.0);
    vec3 slowScanlineAxis = normalize(earthAxis + vec3(0.22, 0.0, 0.08));
    float slowScanlineTravel = fract(u_time * 0.028);
    float slowScanlineOffset = 1.12 - slowScanlineTravel * 2.24;
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
    float aurora =
      smoothstep(0.15, 1.0, auroraWave) *
      u_auroraStrength *
      rim *
      daylight;

    float grain =
      (hash(v_uv * vec2(1024.0, 512.0) + u_time) - 0.5) *
      u_noiseStrength *
      (0.75 - umbraShade * 0.45);
    float parchmentSpeckle =
      (paperFiber - 0.5) *
      (0.06 + u_noiseStrength * 1.3) *
      u_surfaceTextureStrength;
    float reliefLight =
      (dot(reliefNormal, sunDirection) - dot(normalize(v_normal), sunDirection)) *
      reliefMask;
    float reliefHighlight = max(reliefLight, 0.0);
    float reliefShadow = min(reliefLight, 0.0);
    float atmosphere =
      u_atmosphereOpacity *
      (0.03 + directLight * 0.2 + rim * 0.18) *
      sunVisibility;
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
      float pollutionExposure = mix(
        116.0,
        72.0,
        clamp(u_lightPollutionSpread / 3.5, 0.0, 1.0)
      );
      float pollutionResponse = compressRadiance(
        pollutionRadiance,
        pollutionExposure
      );
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
      u_slowScanlineStrength *
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
