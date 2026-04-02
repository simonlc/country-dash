import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

interface LevaControlValue {
  value: boolean | number | string;
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

vi.mock('leva', () => ({
  Leva: () => null as ReactNode,
  button: (onClick: () => void) => ({
    onClick,
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

    for (const [key, value] of Object.entries(schema)) {
      if (isLevaControlValue(value)) {
        next[key] = value.value;
      }
    }

    if (typeof schemaOrFactory === 'function') {
      return [next, () => undefined];
    }

    return next;
  },
}));
