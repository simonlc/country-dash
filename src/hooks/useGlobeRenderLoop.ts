import { useEffect } from 'react';

interface UseGlobeRenderLoopArgs {
  ambientAnimationEnabled: boolean;
  drawCurrentFrame: (now?: number, includeOverlay?: boolean) => void;
  hasCapitalBlipAnimation: boolean;
  hasCipherOverlayAnimation: boolean;
  hasCipherTrafficAnimation: boolean;
  isAnimating: boolean;
}

export function useGlobeRenderLoop({
  ambientAnimationEnabled,
  drawCurrentFrame,
  hasCapitalBlipAnimation,
  hasCipherOverlayAnimation,
  hasCipherTrafficAnimation,
  isAnimating,
}: UseGlobeRenderLoopArgs) {
  useEffect(() => {
    let cancelled = false;
    let frameId = 0;
    let timeoutId = 0;

    const scheduleNextFrame = () => {
      if (cancelled || document.visibilityState === 'hidden') {
        return;
      }

      if (isAnimating) {
        return;
      }

      if (
        ambientAnimationEnabled ||
        hasCapitalBlipAnimation ||
        hasCipherOverlayAnimation ||
        hasCipherTrafficAnimation
      ) {
        timeoutId = window.setTimeout(() => {
          frameId = window.requestAnimationFrame(renderLoop);
        }, 1000 / 12);
      }
    };

    const renderLoop = (now: number) => {
      drawCurrentFrame(
        now,
        hasCapitalBlipAnimation ||
          hasCipherOverlayAnimation ||
          hasCipherTrafficAnimation,
      );
      scheduleNextFrame();
    };

    const handleVisibilityChange = () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);

      if (!cancelled && document.visibilityState === 'visible') {
        drawCurrentFrame();
        scheduleNextFrame();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    scheduleNextFrame();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
    };
  }, [
    ambientAnimationEnabled,
    drawCurrentFrame,
    hasCapitalBlipAnimation,
    hasCipherOverlayAnimation,
    hasCipherTrafficAnimation,
    isAnimating,
  ]);
}
