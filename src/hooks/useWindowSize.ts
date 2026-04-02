import { useEffect, useState } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

function getWindowSize(): WindowSize {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
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

    window.addEventListener('resize', handleResize);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}
