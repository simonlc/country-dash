import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

interface LevaControlValue {
  value: boolean | number | string;
}

interface LevaFolderValue {
  schema: Record<string, unknown>;
}

function isLevaControlValue(value: unknown): value is LevaControlValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    (typeof (value as { value: unknown }).value === 'boolean' ||
      typeof (value as { value: unknown }).value === 'number' ||
      typeof (value as { value: unknown }).value === 'string')
  );
}

function isLevaFolderValue(value: unknown): value is LevaFolderValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schema' in value &&
    typeof (value as { schema: unknown }).schema === 'object'
  );
}

function collectLevaValues(
  schema: Record<string, unknown>,
  output: Record<string, boolean | number | string>,
) {
  for (const [key, value] of Object.entries(schema)) {
    if (isLevaControlValue(value)) {
      output[key] = value.value;
      continue;
    }

    if (isLevaFolderValue(value)) {
      collectLevaValues(value.schema, output);
    }
  }
}

vi.mock('leva', () => ({
  Leva: () => null as ReactNode,
  button: (onClick: () => void) => ({
    onClick,
  }),
  folder: (
    schema: Record<string, unknown>,
    settings?: Record<string, unknown>,
  ) => ({
    schema,
    settings,
  }),
  useControls: (
    _folder: string,
    schemaOrFactory: Record<string, unknown> | (() => Record<string, unknown>),
  ):
    | Record<string, boolean | number | string>
    | [
        Record<string, boolean | number | string>,
        (patch: Record<string, boolean | number | string>) => void,
      ] => {
    const schema =
      typeof schemaOrFactory === 'function' ? schemaOrFactory() : schemaOrFactory;
    const next: Record<string, boolean | number | string> = {};
    collectLevaValues(schema, next);

    if (typeof schemaOrFactory === 'function') {
      return [next, () => undefined];
    }

    return next;
  },
}));
