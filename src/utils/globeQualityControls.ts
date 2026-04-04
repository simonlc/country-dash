import { folder } from 'leva';
import type {
  GlobePalette,
  GlobeQualityConfig,
  GlobeRenderConfig,
  GlobeThemeSettings,
} from '@/app/theme';

export interface GlobeThemeSettingsPatch {
  globe?: Partial<GlobePalette>;
  quality?: Partial<GlobeQualityConfig>;
  render?: Partial<GlobeRenderConfig>;
}

type ControlDefinition<Value> =
  | {
      kind: 'boolean';
      group: readonly string[];
      key: keyof Value;
      label?: string;
    }
  | {
      kind: 'number';
      group: readonly string[];
      key: keyof Value;
      label?: string;
      max: number;
      min: number;
      step: number;
    }
  | {
      kind: 'color' | 'string';
      group: readonly string[];
      key: keyof Value;
      label?: string;
    };

type ControlSchema<Value> = {
  [Key in keyof Value]: Value[Key] extends boolean
    ? {
        value: boolean;
      }
    : Value[Key] extends number
      ? {
          max: number;
          min: number;
          step: number;
          value: number;
        }
      : {
          value: string;
        };
};

const globePaletteControlDefinitions = [
  { key: 'oceanFill', kind: 'color', group: ['Ocean'], label: 'Fill' },
  { key: 'oceanDepth', kind: 'color', group: ['Ocean'], label: 'Depth' },
  { key: 'oceanHighlight', kind: 'color', group: ['Ocean'], label: 'Highlight' },
  {
    key: 'oceanHighlightOpacity',
    kind: 'number',
    group: ['Ocean'],
    label: 'Highlight Opacity',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'countryFill',
    kind: 'color',
    group: ['Countries', 'Base'],
    label: 'Fill',
  },
  {
    key: 'countryStroke',
    kind: 'color',
    group: ['Countries', 'Base'],
    label: 'Stroke',
  },
  {
    key: 'graticule',
    kind: 'color',
    group: ['Countries', 'Base'],
    label: 'Graticule',
  },
  {
    key: 'countryElevation',
    kind: 'number',
    group: ['Countries', 'Base'],
    label: 'Elevation',
    min: 0,
    max: 0.1,
    step: 0.001,
  },
  {
    key: 'countryDebossDark',
    kind: 'color',
    group: ['Countries', 'Emboss'],
    label: 'Dark',
  },
  {
    key: 'countryDebossLight',
    kind: 'color',
    group: ['Countries', 'Emboss'],
    label: 'Light',
  },
  {
    key: 'countryDebossWidth',
    kind: 'number',
    group: ['Countries', 'Emboss'],
    label: 'Width',
    min: 0,
    max: 8,
    step: 0.05,
  },
  {
    key: 'countryDebossOffset',
    kind: 'number',
    group: ['Countries', 'Emboss'],
    label: 'Offset',
    min: 0,
    max: 4,
    step: 0.05,
  },
  {
    key: 'countryDebossStrength',
    kind: 'number',
    group: ['Countries', 'Emboss'],
    label: 'Strength',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'countryShadowColor',
    kind: 'color',
    group: ['Countries', 'Shadow'],
    label: 'Color',
  },
  {
    key: 'countryShadowBlur',
    kind: 'number',
    group: ['Countries', 'Shadow'],
    label: 'Blur',
    min: 0,
    max: 100,
    step: 0.1,
  },
  {
    key: 'countryShadowOffsetX',
    kind: 'number',
    group: ['Countries', 'Shadow'],
    label: 'Offset X',
    min: -8,
    max: 8,
    step: 0.05,
  },
  {
    key: 'countryShadowOffsetY',
    kind: 'number',
    group: ['Countries', 'Shadow'],
    label: 'Offset Y',
    min: -8,
    max: 8,
    step: 0.05,
  },
  {
    key: 'selectedFill',
    kind: 'color',
    group: ['Selection'],
    label: 'Selected Fill',
  },
  {
    key: 'smallCountryCircle',
    kind: 'color',
    group: ['Selection'],
    label: 'Ring / Marker',
  },
  {
    key: 'hazeOuter',
    kind: 'color',
    group: ['Atmosphere'],
    label: 'Haze Outer',
  },
  {
    key: 'hazeInner',
    kind: 'color',
    group: ['Atmosphere'],
    label: 'Haze Inner',
  },
  {
    key: 'nightShade',
    kind: 'color',
    group: ['Atmosphere'],
    label: 'Night Shade',
  },
  {
    key: 'atmosphereTint',
    kind: 'color',
    group: ['Atmosphere'],
    label: 'Tint',
  },
  {
    key: 'atmosphereOpacity',
    kind: 'number',
    group: ['Atmosphere'],
    label: 'Opacity',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'gridColor',
    kind: 'color',
    group: ['Shader FX'],
    label: 'Grid Color',
  },
  {
    key: 'rimLightColor',
    kind: 'color',
    group: ['Shader FX'],
    label: 'Rim Light Color',
  },
  {
    key: 'specularColor',
    kind: 'color',
    group: ['Shader FX'],
    label: 'Specular Color',
  },
  {
    key: 'auroraStrength',
    kind: 'number',
    group: ['Shader FX'],
    label: 'Aurora',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'gridStrength',
    kind: 'number',
    group: ['Shader FX'],
    label: 'Grid Strength',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'noiseStrength',
    kind: 'number',
    group: ['Shader FX'],
    label: 'Noise',
    min: 0,
    max: 0.5,
    step: 0.005,
  },
  {
    key: 'rimLightStrength',
    kind: 'number',
    group: ['Shader FX'],
    label: 'Rim Light',
    min: 0,
    max: 1,
    step: 0.005,
  },
  {
    key: 'scanlineDensity',
    kind: 'number',
    group: ['Shader FX'],
    label: 'Scanline Density',
    min: 0,
    max: 720,
    step: 1,
  },
  {
    key: 'scanlineStrength',
    kind: 'number',
    group: ['Shader FX'],
    label: 'Scanline Strength',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'specularPower',
    kind: 'number',
    group: ['Shader FX'],
    label: 'Specular Power',
    min: 1,
    max: 128,
    step: 1,
  },
  {
    key: 'specularStrength',
    kind: 'number',
    group: ['Shader FX'],
    label: 'Specular Strength',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'surfaceDistortionStrength',
    kind: 'number',
    group: ['Shader FX'],
    label: 'Surface Distortion',
    min: 0,
    max: 2,
    step: 0.01,
  },
  {
    key: 'surfaceTextureStrength',
    kind: 'number',
    group: ['Shader FX'],
    label: 'Surface Texture',
    min: 0,
    max: 2,
    step: 0.01,
  },
] satisfies ControlDefinition<GlobePalette>[];

const globeQualityControlDefinitions = [
  { key: 'reliefMapEnabled', kind: 'boolean', group: ['Relief & Imagery'] },
  {
    key: 'reliefHeight',
    kind: 'number',
    group: ['Relief & Imagery'],
    label: 'Relief Height',
    max: 3,
    min: 0,
    step: 0.05,
  },
  { key: 'dayImageryEnabled', kind: 'boolean', group: ['Relief & Imagery'] },
  {
    key: 'nightImageryEnabled',
    kind: 'boolean',
    group: ['Relief & Imagery'],
  },
  { key: 'waterMaskEnabled', kind: 'boolean', group: ['Relief & Imagery'] },
  { key: 'cityLightsEnabled', kind: 'boolean', group: ['Night Lighting'] },
  {
    key: 'cityLightsIntensity',
    kind: 'number',
    group: ['Night Lighting'],
    label: 'City Intensity',
    max: 4,
    min: 0,
    step: 0.05,
  },
  {
    key: 'cityLightsThreshold',
    kind: 'number',
    group: ['Night Lighting'],
    label: 'City Threshold',
    max: 0.95,
    min: 0,
    step: 0.01,
  },
  {
    key: 'cityLightsGlow',
    kind: 'number',
    group: ['Night Lighting'],
    label: 'City Glow',
    max: 4,
    min: 0,
    step: 0.05,
  },
  {
    key: 'cityLightsColor',
    kind: 'color',
    group: ['Night Lighting'],
    label: 'City Color',
  },
  { key: 'lightPollutionEnabled', kind: 'boolean', group: ['Night Lighting'] },
  {
    key: 'lightPollutionIntensity',
    kind: 'number',
    group: ['Night Lighting'],
    label: 'Pollution Intensity',
    max: 4,
    min: 0,
    step: 0.05,
  },
  {
    key: 'lightPollutionSpread',
    kind: 'number',
    group: ['Night Lighting'],
    label: 'Pollution Spread',
    max: 6,
    min: 0.25,
    step: 0.05,
  },
  {
    key: 'lightPollutionColor',
    kind: 'color',
    group: ['Night Lighting'],
    label: 'Pollution Color',
  },
  {
    key: 'umbraDarkness',
    kind: 'number',
    group: ['Night Lighting'],
    label: 'Umbra Darkness',
    max: 1,
    min: 0,
    step: 0.05,
  },
  { key: 'showLakes', kind: 'boolean', group: ['Hydro'] },
  { key: 'showRivers', kind: 'boolean', group: ['Hydro'] },
  {
    key: 'lakesOpacity',
    kind: 'number',
    group: ['Hydro'],
    label: 'Lakes Opacity',
    max: 1,
    min: 0,
    step: 0.01,
  },
  {
    key: 'riversOpacity',
    kind: 'number',
    group: ['Hydro'],
    label: 'Rivers Opacity',
    max: 1,
    min: 0,
    step: 0.01,
  },
  {
    key: 'riversWidth',
    kind: 'number',
    group: ['Hydro'],
    label: 'Rivers Width',
    max: 5,
    min: 0.1,
    step: 0.05,
  },
  { key: 'lakesColor', kind: 'color', group: ['Hydro'], label: 'Lakes Color' },
  {
    key: 'riversColor',
    kind: 'color',
    group: ['Hydro'],
    label: 'Rivers Color',
  },
] satisfies ControlDefinition<GlobeQualityConfig>[];

const globeRenderControlDefinitions = [
  { key: 'reliefStrengthMultiplier', kind: 'number', group: ['Global'], label: 'Relief Multiplier', min: 0, max: 32, step: 0.1 },
  { key: 'slowScanlineStrength', kind: 'number', group: ['Global'], label: 'Slow Scanline', min: 0, max: 1, step: 0.01 },
  {
    key: 'standardGraticuleLineWidth',
    kind: 'number',
    group: ['Strokes', 'Standard'],
    label: 'Graticule Width',
    min: 0,
    max: 6,
    step: 0.05,
  },
  {
    key: 'standardCountryStrokeWidth',
    kind: 'number',
    group: ['Strokes', 'Standard'],
    label: 'Country Width',
    min: 0,
    max: 6,
    step: 0.05,
  },
  {
    key: 'standardSelectedCountryStrokeWidth',
    kind: 'number',
    group: ['Strokes', 'Standard'],
    label: 'Selected Width',
    min: 0,
    max: 8,
    step: 0.05,
  },
  { key: 'atlasStyleEnabled', kind: 'boolean', group: ['Atlas'] },
  {
    key: 'atlasParchmentAgingOpacity',
    kind: 'number',
    group: ['Atlas'],
    label: 'Parchment Aging',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'atlasWatercolorOceanOpacity',
    kind: 'number',
    group: ['Atlas'],
    label: 'Watercolor Ocean',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'atlasWatercolorLandOpacity',
    kind: 'number',
    group: ['Atlas'],
    label: 'Watercolor Land',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'atlasBiomeWatercolorOpacity',
    kind: 'number',
    group: ['Atlas'],
    label: 'Biome Wash',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'atlasOceanCurrentHatchingOpacity',
    kind: 'number',
    group: ['Atlas'],
    label: 'Ocean Hatching',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'atlasCoastalWashOpacity',
    kind: 'number',
    group: ['Atlas'],
    label: 'Coastal Wash',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'atlasInkCoastlineOpacity',
    kind: 'number',
    group: ['Atlas'],
    label: 'Ink Coastline',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'atlasInkBleedOpacity',
    kind: 'number',
    group: ['Atlas'],
    label: 'Ink Bleed',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'atlasExpeditionDetailsOpacity',
    kind: 'number',
    group: ['Atlas'],
    label: 'Expedition Details',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'atlasGraticuleOpacity',
    kind: 'number',
    group: ['Strokes', 'Atlas'],
    label: 'Graticule Opacity',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'atlasGraticuleLineWidth',
    kind: 'number',
    group: ['Strokes', 'Atlas'],
    label: 'Graticule Width',
    min: 0,
    max: 6,
    step: 0.05,
  },
  {
    key: 'atlasGraticuleDashLength',
    kind: 'number',
    group: ['Strokes', 'Atlas'],
    label: 'Dash Length',
    min: 0,
    max: 20,
    step: 0.1,
  },
  {
    key: 'atlasGraticuleGapLength',
    kind: 'number',
    group: ['Strokes', 'Atlas'],
    label: 'Gap Length',
    min: 0,
    max: 20,
    step: 0.1,
  },
  {
    key: 'atlasCountryStrokeWidth',
    kind: 'number',
    group: ['Strokes', 'Atlas'],
    label: 'Country Width',
    min: 0,
    max: 6,
    step: 0.05,
  },
  {
    key: 'atlasSelectedCountryStrokeWidth',
    kind: 'number',
    group: ['Strokes', 'Atlas'],
    label: 'Selected Width',
    min: 0,
    max: 8,
    step: 0.05,
  },
  {
    key: 'cipherHydroTextureEffectOpacity',
    kind: 'number',
    group: ['Cipher'],
    label: 'Hydro Texture FX',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'cipherHydroOverlayOpacity',
    kind: 'number',
    group: ['Cipher'],
    label: 'Hydro Overlay',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'cipherTrafficOverlayOpacity',
    kind: 'number',
    group: ['Cipher'],
    label: 'Traffic Overlay',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'cipherSelectedCountryOverlayOpacity',
    kind: 'number',
    group: ['Cipher'],
    label: 'Selection Overlay',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'cipherMapAnnotationsOpacity',
    kind: 'number',
    group: ['Cipher'],
    label: 'Map Annotations',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'cipherCountryTransitionOpacity',
    kind: 'number',
    group: ['Cipher'],
    label: 'Country Transition',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'cipherScreenTransitionOverlayOpacity',
    kind: 'number',
    group: ['Cipher'],
    label: 'Screen Overlay',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'cipherFocusDelayMs',
    kind: 'number',
    group: ['Cipher'],
    label: 'Focus Delay',
    min: 0,
    max: 2000,
    step: 10,
  },
] satisfies ControlDefinition<GlobeRenderConfig>[];

export type GlobePaletteControlSchema = ControlSchema<GlobePalette>;
export type GlobeQualityControlSchema = ControlSchema<GlobeQualityConfig>;
export type GlobeRenderControlSchema = ControlSchema<GlobeRenderConfig>;

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function createLabel(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();
}

function isFolderInput(
  value: unknown,
): value is {
  schema: Record<string, unknown>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schema' in value &&
    typeof (value as { schema?: unknown }).schema === 'object'
  );
}

function upsertFolder(
  schema: Record<string, unknown>,
  path: readonly string[],
) {
  let currentSchema = schema;

  for (const [index, segment] of path.entries()) {
    const existing = currentSchema[segment];
    if (!isFolderInput(existing)) {
      currentSchema[segment] = folder(
        {},
        {
          collapsed: index > 0,
        },
      );
    }

    currentSchema = (currentSchema[segment] as { schema: Record<string, unknown> })
      .schema;
  }

  return currentSchema;
}

function buildControlSchema<Value>(
  value: Value,
  definitions: ControlDefinition<Value>[],
) {
  const schema: Record<string, unknown> = {};

  for (const definition of definitions) {
    const key = definition.key;
    const targetSchema = upsertFolder(schema, definition.group);

    if (definition.kind === 'boolean') {
      targetSchema[key as string] = {
        label: definition.label ?? createLabel(key as string),
        value: value[key] as boolean,
      } as unknown as ControlSchema<Value>[typeof key];
      continue;
    }

    if (definition.kind === 'number') {
      targetSchema[key as string] = {
        label: definition.label ?? createLabel(key as string),
        max: definition.max,
        min: definition.min,
        step: definition.step,
        value: value[key] as number,
      } as unknown as ControlSchema<Value>[typeof key];
      continue;
    }

    targetSchema[key as string] = {
      label: definition.label ?? createLabel(key as string),
      type: definition.kind === 'color' ? 'COLOR' : 'STRING',
      value: value[key] as string,
    } as unknown as ControlSchema<Value>[typeof key];
  }

  return schema as ControlSchema<Value>;
}

function sanitizeControlsPatch<Value>(
  value: Partial<Value> | undefined,
  definitions: ControlDefinition<Value>[],
) {
  const next: Partial<Value> = {};

  if (!value) {
    return next;
  }

  for (const definition of definitions) {
    const candidate = value[definition.key];

    if (definition.kind === 'boolean') {
      if (typeof candidate === 'boolean') {
        next[definition.key] = candidate as Value[keyof Value];
      }
      continue;
    }

    if (definition.kind === 'number') {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        next[definition.key] = clampNumber(
          candidate,
          definition.min,
          definition.max,
        ) as Value[keyof Value];
      }
      continue;
    }

    if (
      (definition.kind === 'string' || definition.kind === 'color') &&
      typeof candidate === 'string' &&
      candidate.length > 0
    ) {
      next[definition.key] = candidate as Value[keyof Value];
    }
  }

  return next;
}

function createControlsPatch<Value>(
  controls: Value,
  current: Value,
  definitions: ControlDefinition<Value>[],
) {
  const patch: Partial<Value> = {};

  for (const definition of definitions) {
    const key = definition.key;
    if (controls[key] === current[key]) {
      continue;
    }

    patch[key] = controls[key];
  }

  return patch;
}

export function buildGlobePaletteControlSchema(
  palette: GlobePalette,
): GlobePaletteControlSchema {
  return buildControlSchema(palette, globePaletteControlDefinitions);
}

export function buildGlobeQualityControlSchema(
  quality: GlobeQualityConfig,
): GlobeQualityControlSchema {
  return buildControlSchema(quality, globeQualityControlDefinitions);
}

export function buildGlobeRenderControlSchema(
  render: GlobeRenderConfig,
): GlobeRenderControlSchema {
  return buildControlSchema(render, globeRenderControlDefinitions);
}

export function sanitizeGlobeThemeSettingsPatch(
  value: GlobeThemeSettingsPatch,
): GlobeThemeSettingsPatch {
  return {
    globe: sanitizeControlsPatch(value.globe, globePaletteControlDefinitions),
    quality: sanitizeControlsPatch(value.quality, globeQualityControlDefinitions),
    render: sanitizeControlsPatch(value.render, globeRenderControlDefinitions),
  };
}

export function createGlobePalettePatch(
  controls: GlobePalette,
  palette: GlobePalette,
) {
  return createControlsPatch(controls, palette, globePaletteControlDefinitions);
}

export function createGlobeQualityPatch(
  controls: GlobeQualityConfig,
  quality: GlobeQualityConfig,
) {
  return createControlsPatch(controls, quality, globeQualityControlDefinitions);
}

export function createGlobeRenderPatch(
  controls: GlobeRenderConfig,
  render: GlobeRenderConfig,
) {
  return createControlsPatch(controls, render, globeRenderControlDefinitions);
}

export function hasThemeSettingsPatch(patch: GlobeThemeSettingsPatch) {
  return Boolean(
    Object.keys(patch.globe ?? {}).length ||
      Object.keys(patch.quality ?? {}).length ||
      Object.keys(patch.render ?? {}).length,
  );
}

export function mergeThemeSettings(
  defaults: GlobeThemeSettings,
  patch: GlobeThemeSettingsPatch,
): GlobeThemeSettings {
  return {
    globe: {
      ...defaults.globe,
      ...patch.globe,
    },
    quality: {
      ...defaults.quality,
      ...patch.quality,
    },
    render: {
      ...defaults.render,
      ...patch.render,
    },
  };
}
