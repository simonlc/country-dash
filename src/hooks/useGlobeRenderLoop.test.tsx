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
    const drawBaseFrame = vi.fn();
    const drawOverlayFrame = vi.fn();

    renderHook(() =>
      useGlobeRenderLoop({
        ambientAnimationEnabled: true,
        drawBaseFrame,
        drawOverlayFrame,
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

    expect(drawBaseFrame).toHaveBeenCalledTimes(1);
    expect(drawOverlayFrame).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('redraws only the overlay layer for overlay-only animation', () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    const drawBaseFrame = vi.fn();
    const drawOverlayFrame = vi.fn();
    let scheduledFrame: ((time: number) => void) | null = null;

    vi.mocked(window.requestAnimationFrame).mockImplementation((callback) => {
      scheduledFrame = callback;
      return 1;
    });

    renderHook(() =>
      useGlobeRenderLoop({
        ambientAnimationEnabled: false,
        drawBaseFrame,
        drawOverlayFrame,
        hasCapitalBlipAnimation: false,
        hasCipherOverlayAnimation: true,
        hasCipherTrafficAnimation: false,
        isAnimating: false,
      }),
    );

    vi.advanceTimersByTime(1000 / 12);
    expect(scheduledFrame).not.toBeNull();
    scheduledFrame!(1000);

    expect(drawBaseFrame).not.toHaveBeenCalled();
    expect(drawOverlayFrame).toHaveBeenCalledTimes(1);
  });
});
