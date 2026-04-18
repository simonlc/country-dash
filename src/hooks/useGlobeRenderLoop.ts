import { useEffect, useRef } from 'react';

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
  const drawBaseFrameRef = useRef(drawBaseFrame);
  const drawOverlayFrameRef = useRef(drawOverlayFrame);

  useEffect(() => {
    drawBaseFrameRef.current = drawBaseFrame;
  }, [drawBaseFrame]);

  useEffect(() => {
    drawOverlayFrameRef.current = drawOverlayFrame;
  }, [drawOverlayFrame]);

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
        drawBaseFrameRef.current(now);
      }
      if (hasOverlayAnimation) {
        drawOverlayFrameRef.current(now);
      }
      scheduleNextFrame();
    };

    const handleVisibilityChange = () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);

      if (!cancelled && document.visibilityState === 'visible') {
        if (ambientAnimationEnabled) {
          drawBaseFrameRef.current();
        }
        if (hasOverlayAnimation) {
          drawOverlayFrameRef.current();
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
