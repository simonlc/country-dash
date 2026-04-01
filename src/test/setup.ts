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
    schema: Record<string, unknown>,
  ): Record<string, boolean | number | string> => {
    const next: Record<string, boolean | number | string> = {};

    for (const [key, value] of Object.entries(schema)) {
      if (isLevaControlValue(value)) {
        next[key] = value.value;
      }
    }

    return next;
  },
}));
