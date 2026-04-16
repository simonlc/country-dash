import { useEffect, useState } from 'react';

interface WindowSize {
  width: number;
  height: number;
  keyboardInset: number;
  isKeyboardOpen: boolean;
}

function getWindowSize(): WindowSize {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0, keyboardInset: 0, isKeyboardOpen: false };
  }

  const layoutWidth = Math.round(window.innerWidth);
  const layoutHeight = Math.round(window.innerHeight);
  const viewport = window.visualViewport;
  const viewportHeight = Math.round(viewport?.height ?? layoutHeight);
  const viewportOffsetTop = Math.round(viewport?.offsetTop ?? 0);
  const keyboardInset = Math.max(
    0,
    layoutHeight - (viewportHeight + viewportOffsetTop),
  );
  const keyboardOpenThreshold = Math.max(
    120,
    Math.round(layoutHeight * 0.18),
  );

  return {
    width: layoutWidth,
    height: layoutHeight,
    keyboardInset,
    isKeyboardOpen: keyboardInset >= keyboardOpenThreshold,
  };
}

export function useWindowSize() {
  const [size, setSize] = useState<WindowSize>(getWindowSize);

  useEffect(() => {
    let frameId = 0;

    const handleResize = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        setSize((previousSize) => {
          const nextSize = getWindowSize();

          if (
            previousSize.width === nextSize.width &&
            previousSize.height === nextSize.height
          ) {
            return previousSize;
          }

          return nextSize;
        });
      });
    };

    const viewport = window.visualViewport;
    window.addEventListener('orientationchange', handleResize);
    window.addEventListener('resize', handleResize);
    viewport?.addEventListener('resize', handleResize);
    viewport?.addEventListener('scroll', handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('resize', handleResize);
      viewport?.removeEventListener('resize', handleResize);
      viewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  return size;
}
