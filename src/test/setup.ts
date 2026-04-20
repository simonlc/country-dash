import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

if (typeof window !== 'undefined' && typeof window.PointerEvent === 'undefined') {
  class PointerEventMock extends MouseEvent implements PointerEvent {
    altitudeAngle = 0;
    azimuthAngle = 0;
    height = 1;
    isPrimary = true;
    persistentDeviceId = 0;
    pointerId = 1;
    pointerType = 'mouse';
    pressure = 0.5;
    tangentialPressure = 0;
    tiltX = 0;
    tiltY = 0;
    twist = 0;
    width = 1;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);

      this.pointerId = params.pointerId ?? 1;
      this.pointerType = params.pointerType ?? 'mouse';
      this.isPrimary = params.isPrimary ?? true;
      this.pressure = params.pressure ?? 0.5;
      this.tangentialPressure = params.tangentialPressure ?? 0;
      this.tiltX = params.tiltX ?? 0;
      this.tiltY = params.tiltY ?? 0;
      this.twist = params.twist ?? 0;
      this.width = params.width ?? 1;
      this.height = params.height ?? 1;
    }

    getCoalescedEvents(): PointerEvent[] {
      return [this];
    }

    getPredictedEvents(): PointerEvent[] {
      return [];
    }
  }

  window.PointerEvent =
    PointerEventMock as unknown as typeof window.PointerEvent;
}

if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'undefined') {
  class ResizeObserverMock {
    observe() {}

    unobserve() {}

    disconnect() {}
  }

  window.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
}

if (typeof window !== 'undefined' && typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.setPointerCapture = vi.fn();
}

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
