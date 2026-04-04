import { useEffect } from 'react';

interface UseGlobeRenderLoopArgs {
  ambientAnimationEnabled: boolean;
  drawBaseFrame: (now?: number) => void;
  drawOverlayFrame: (now?: number) => void;
  hasCapitalBlipAnimation: boolean;
  hasCipherOverlayAnimation: boolean;
  hasCipherTrafficAnimation: boolean;
  isAnimating: boolean;
}

export function useGlobeRenderLoop({
  ambientAnimationEnabled,
  drawBaseFrame,
  drawOverlayFrame,
  hasCapitalBlipAnimation,
  hasCipherOverlayAnimation,
  hasCipherTrafficAnimation,
  isAnimating,
}: UseGlobeRenderLoopArgs) {
  useEffect(() => {
    let cancelled = false;
    let frameId = 0;
    let timeoutId = 0;
    const hasOverlayAnimation =
      hasCapitalBlipAnimation ||
      hasCipherOverlayAnimation ||
      hasCipherTrafficAnimation;
    const hasAnyAnimation = ambientAnimationEnabled || hasOverlayAnimation;

    const scheduleNextFrame = () => {
      if (cancelled || document.visibilityState === 'hidden') {
        return;
      }

      if (isAnimating) {
        return;
      }

      if (hasAnyAnimation) {
        timeoutId = window.setTimeout(() => {
          frameId = window.requestAnimationFrame(renderLoop);
        }, 1000 / 12);
      }
    };

    const renderLoop = (now: number) => {
      if (ambientAnimationEnabled) {
        drawBaseFrame(now);
      }
      if (hasOverlayAnimation) {
        drawOverlayFrame(now);
      }
      scheduleNextFrame();
    };

    const handleVisibilityChange = () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);

      if (!cancelled && document.visibilityState === 'visible') {
        if (ambientAnimationEnabled) {
          drawBaseFrame();
        }
        if (hasOverlayAnimation) {
          drawOverlayFrame();
        }
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
    drawBaseFrame,
    drawOverlayFrame,
    hasCapitalBlipAnimation,
    hasCipherOverlayAnimation,
    hasCipherTrafficAnimation,
    isAnimating,
  ]);
}
