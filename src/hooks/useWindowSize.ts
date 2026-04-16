import { useEffect, useState } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

function getWindowSize(): WindowSize {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  const viewport = window.visualViewport;

  return {
    width: Math.round(viewport?.width ?? window.innerWidth),
    height: Math.round(viewport?.height ?? window.innerHeight),
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
