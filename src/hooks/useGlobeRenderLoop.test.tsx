import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGlobeRenderLoop } from './useGlobeRenderLoop';

describe('useGlobeRenderLoop', () => {
  const originalVisibilityState = Object.getOwnPropertyDescriptor(
    document,
    'visibilityState',
  );

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (originalVisibilityState) {
      Object.defineProperty(document, 'visibilityState', originalVisibilityState);
    }
  });

  it('pauses while the document is hidden and resumes when visible', () => {
    const drawCurrentFrame = vi.fn();

    renderHook(() =>
      useGlobeRenderLoop({
        ambientAnimationEnabled: true,
        drawCurrentFrame,
        hasCapitalBlipAnimation: false,
        hasCipherOverlayAnimation: false,
        hasCipherTrafficAnimation: false,
        isAnimating: false,
      }),
    );

    vi.advanceTimersByTime(1000);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(drawCurrentFrame).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });
});
