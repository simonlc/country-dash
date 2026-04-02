import type { GlobeQualityConfig } from '@/app/theme';

type GlobeQualityKeyByType<T> = {
  [Key in keyof GlobeQualityConfig]: GlobeQualityConfig[Key] extends T
    ? Key
    : never;
}[keyof GlobeQualityConfig];

type GlobeQualityBooleanKey = GlobeQualityKeyByType<boolean>;
type GlobeQualityNumberKey = GlobeQualityKeyByType<number>;
type GlobeQualityStringKey = GlobeQualityKeyByType<string>;

interface GlobeQualityBooleanControlDefinition {
  key: GlobeQualityBooleanKey;
  kind: 'boolean';
}

interface GlobeQualityNumberControlDefinition {
  key: GlobeQualityNumberKey;
  kind: 'number';
  max: number;
  min: number;
  step: number;
}

interface GlobeQualityStringControlDefinition {
  key: GlobeQualityStringKey;
  kind: 'string';
}

export type GlobeQualityControlDefinition =
  | GlobeQualityBooleanControlDefinition
  | GlobeQualityNumberControlDefinition
  | GlobeQualityStringControlDefinition;

interface GlobeQualityBooleanControlConfig {
  value: boolean;
}

interface GlobeQualityNumberControlConfig {
  max: number;
  min: number;
  step: number;
  value: number;
}

interface GlobeQualityStringControlConfig {
  value: string;
}

type GlobeQualityControlConfig<Key extends keyof GlobeQualityConfig> =
  GlobeQualityConfig[Key] extends boolean
    ? GlobeQualityBooleanControlConfig
    : GlobeQualityConfig[Key] extends number
      ? GlobeQualityNumberControlConfig
      : GlobeQualityStringControlConfig;

export type GlobeQualityControlSchema = {
  [Key in keyof GlobeQualityConfig]: GlobeQualityControlConfig<Key>;
};

export const globeQualityControlDefinitions = [
  { key: 'reliefMapEnabled', kind: 'boolean' },
  { key: 'reliefHeight', kind: 'number', max: 3, min: 0, step: 0.05 },
  { key: 'dayImageryEnabled', kind: 'boolean' },
  { key: 'nightImageryEnabled', kind: 'boolean' },
  { key: 'cityLightsEnabled', kind: 'boolean' },
  { key: 'cityLightsIntensity', kind: 'number', max: 4, min: 0, step: 0.05 },
  {
    key: 'cityLightsThreshold',
    kind: 'number',
    max: 0.95,
    min: 0,
    step: 0.01,
  },
  { key: 'cityLightsGlow', kind: 'number', max: 4, min: 0, step: 0.05 },
  { key: 'cityLightsColor', kind: 'string' },
  { key: 'lightPollutionEnabled', kind: 'boolean' },
  {
    key: 'lightPollutionIntensity',
    kind: 'number',
    max: 4,
    min: 0,
    step: 0.05,
  },
  {
    key: 'lightPollutionSpread',
    kind: 'number',
    max: 6,
    min: 0.25,
    step: 0.05,
  },
  { key: 'lightPollutionColor', kind: 'string' },
  { key: 'waterMaskEnabled', kind: 'boolean' },
  { key: 'showLakes', kind: 'boolean' },
  { key: 'showRivers', kind: 'boolean' },
  { key: 'lakesOpacity', kind: 'number', max: 1, min: 0, step: 0.01 },
  { key: 'riversOpacity', kind: 'number', max: 1, min: 0, step: 0.01 },
  { key: 'riversWidth', kind: 'number', max: 5, min: 0.1, step: 0.05 },
  { key: 'lakesColor', kind: 'string' },
  { key: 'riversColor', kind: 'string' },
  { key: 'umbraDarkness', kind: 'number', max: 1, min: 0, step: 0.05 },
] satisfies GlobeQualityControlDefinition[];

function setBooleanPatch(
  patch: Partial<GlobeQualityConfig>,
  key: GlobeQualityBooleanKey,
  value: boolean,
) {
  patch[key] = value;
}

function setNumberPatch(
  patch: Partial<GlobeQualityConfig>,
  key: GlobeQualityNumberKey,
  value: number,
) {
  patch[key] = value;
}

function setStringPatch(
  patch: Partial<GlobeQualityConfig>,
  key: GlobeQualityStringKey,
  value: string,
) {
  patch[key] = value;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function sanitizeGlobeQualityPatch(
  value: Partial<GlobeQualityConfig>,
): Partial<GlobeQualityConfig> {
  const next: Partial<GlobeQualityConfig> = {};

  for (const definition of globeQualityControlDefinitions) {
    const candidate = value[definition.key];

    if (definition.kind === 'boolean') {
      if (typeof candidate === 'boolean') {
        setBooleanPatch(next, definition.key, candidate);
      }
      continue;
    }

    if (definition.kind === 'number') {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        setNumberPatch(
          next,
          definition.key,
          clampNumber(candidate, definition.min, definition.max),
        );
      }
      continue;
    }

    if (typeof candidate === 'string' && candidate.length > 0) {
      setStringPatch(next, definition.key, candidate);
    }
  }

  return next;
}

export function buildGlobeQualityControlSchema(
  quality: GlobeQualityConfig,
): GlobeQualityControlSchema {
  const schema = {} as GlobeQualityControlSchema;

  for (const definition of globeQualityControlDefinitions) {
    if (definition.kind === 'boolean') {
      schema[definition.key] = {
        value: quality[definition.key],
      } as GlobeQualityControlSchema[typeof definition.key];
      continue;
    }

    if (definition.kind === 'number') {
      schema[definition.key] = {
        max: definition.max,
        min: definition.min,
        step: definition.step,
        value: quality[definition.key],
      } as GlobeQualityControlSchema[typeof definition.key];
      continue;
    }

    schema[definition.key] = {
      value: quality[definition.key],
    } as GlobeQualityControlSchema[typeof definition.key];
  }

  return schema;
}

export function createGlobeQualityPatch(
  controls: GlobeQualityConfig,
  quality: GlobeQualityConfig,
) {
  const patch: Partial<GlobeQualityConfig> = {};

  for (const definition of globeQualityControlDefinitions) {
    const nextValue = controls[definition.key];
    const currentValue = quality[definition.key];

    if (nextValue === currentValue) {
      continue;
    }

    if (definition.kind === 'boolean') {
      setBooleanPatch(patch, definition.key, nextValue as boolean);
      continue;
    }

    if (definition.kind === 'number') {
      setNumberPatch(patch, definition.key, nextValue as number);
      continue;
    }

    setStringPatch(patch, definition.key, nextValue as string);
  }

  return patch;
}
