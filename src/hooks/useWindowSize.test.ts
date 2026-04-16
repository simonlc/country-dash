import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useWindowSize } from './useWindowSize';

interface MutableVisualViewport extends EventTarget {
  height: number;
  offsetLeft: number;
  offsetTop: number;
  pageLeft: number;
  pageTop: number;
  scale: number;
  width: number;
}

function createVisualViewport({
  height,
  offsetTop = 0,
  width = 390,
}: {
  height: number;
  offsetTop?: number;
  width?: number;
}) {
  const viewport = new EventTarget() as MutableVisualViewport;
  viewport.height = height;
  viewport.offsetLeft = 0;
  viewport.offsetTop = offsetTop;
  viewport.pageLeft = 0;
  viewport.pageTop = 0;
  viewport.scale = 1;
  viewport.width = width;

  return viewport;
}

describe('useWindowSize', () => {
  let clientWidth = 390;
  let clientHeight = 844;

  beforeEach(() => {
    clientWidth = 390;
    clientHeight = 844;
  });

  afterEach(() => {
    document.documentElement.style.removeProperty('--keyboard-fallback-inset');
    document.documentElement.style.removeProperty('--visual-viewport-height');
    document.documentElement.style.removeProperty('--visual-viewport-offset-left');
    document.documentElement.style.removeProperty('--visual-viewport-offset-top');
  });

  it('tracks keyboard inset from visual viewport changes without shrinking scene height', async () => {
    const viewport = createVisualViewport({ height: 844 });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      get: () => clientWidth,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      configurable: true,
      get: () => clientHeight,
    });
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 390,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 844,
      writable: true,
    });
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: viewport as unknown as VisualViewport,
    });

    const { result } = renderHook(() => useWindowSize());

    await waitFor(() => {
      expect(result.current.height).toBe(844);
      expect(result.current.isKeyboardOpen).toBe(false);
    });

    act(() => {
      viewport.height = 500;
      viewport.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => {
      expect(result.current.isKeyboardOpen).toBe(true);
      expect(result.current.keyboardInset).toBeGreaterThan(300);
      expect(result.current.height).toBe(844);
    });
  });

});
