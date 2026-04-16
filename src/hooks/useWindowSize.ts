import { useEffect, useState } from 'react';

interface WindowSize {
  width: number;
  height: number;
  visualHeight: number;
  visualOffsetLeft: number;
  visualOffsetTop: number;
  keyboardInset: number;
  isKeyboardOpen: boolean;
}

interface VirtualKeyboardLike extends EventTarget {
  boundingRect: DOMRectReadOnly;
  overlaysContent: boolean;
}

interface NavigatorWithVirtualKeyboard extends Navigator {
  virtualKeyboard?: VirtualKeyboardLike;
}

interface ViewportBaseline {
  orientation: 'landscape' | 'portrait';
  stableHeight: number;
}

function getOrientation(width: number, height: number): 'landscape' | 'portrait' {
  return width >= height ? 'landscape' : 'portrait';
}

function getVirtualKeyboard(): VirtualKeyboardLike | null {
  return (navigator as NavigatorWithVirtualKeyboard).virtualKeyboard ?? null;
}

function getVirtualKeyboardInset(virtualKeyboard: VirtualKeyboardLike | null) {
  if (!virtualKeyboard) {
    return 0;
  }

  return Math.max(0, Math.round(virtualKeyboard.boundingRect.height));
}

function getWindowSize(
  baseline: ViewportBaseline,
  virtualKeyboard: VirtualKeyboardLike | null,
): WindowSize {
  if (typeof window === 'undefined') {
    return {
      width: 0,
      height: 0,
      visualHeight: 0,
      visualOffsetLeft: 0,
      visualOffsetTop: 0,
      keyboardInset: 0,
      isKeyboardOpen: false,
    };
  }

  const layoutWidth = Math.round(
    document.documentElement.clientWidth || window.innerWidth,
  );
  const layoutHeight = Math.round(
    document.documentElement.clientHeight || window.innerHeight,
  );
  const viewport = window.visualViewport;
  const viewportHeight = Math.round(viewport?.height ?? layoutHeight);
  const viewportOffsetLeft = Math.round(viewport?.offsetLeft ?? 0);
  const viewportOffsetTop = Math.round(viewport?.offsetTop ?? 0);
  const viewportBottom = viewportHeight + viewportOffsetTop;
  const orientation = getOrientation(layoutWidth, layoutHeight);

  if (baseline.orientation !== orientation || baseline.stableHeight <= 0) {
    baseline.orientation = orientation;
    baseline.stableHeight = Math.max(layoutHeight, viewportBottom);
  }

  const keyboardInsetFromViewport = Math.max(
    0,
    baseline.stableHeight - viewportBottom,
  );
  const keyboardInsetFromVirtualKeyboard = getVirtualKeyboardInset(virtualKeyboard);
  const keyboardInset = Math.max(
    keyboardInsetFromViewport,
    keyboardInsetFromVirtualKeyboard,
  );
  const keyboardOpenThreshold = Math.max(80, Math.round(baseline.stableHeight * 0.12));
  const isKeyboardOpen = keyboardInset >= keyboardOpenThreshold;

  if (!isKeyboardOpen) {
    baseline.stableHeight = Math.max(
      baseline.stableHeight,
      layoutHeight,
      viewportBottom,
    );
  }

  return {
    width: layoutWidth,
    height: baseline.stableHeight,
    visualHeight: viewportHeight,
    visualOffsetLeft: viewportOffsetLeft,
    visualOffsetTop: viewportOffsetTop,
    keyboardInset: isKeyboardOpen ? keyboardInset : 0,
    isKeyboardOpen,
  };
}

export function useWindowSize() {
  const [size, setSize] = useState<WindowSize>(() => {
    const baseline: ViewportBaseline = {
      orientation: 'portrait',
      stableHeight: 0,
    };

    return getWindowSize(baseline, null);
  });

  useEffect(() => {
    const baseline: ViewportBaseline = {
      orientation: getOrientation(
        Math.round(document.documentElement.clientWidth || window.innerWidth),
        Math.round(document.documentElement.clientHeight || window.innerHeight),
      ),
      stableHeight: 0,
    };
    const virtualKeyboard = getVirtualKeyboard();

    if (virtualKeyboard) {
      virtualKeyboard.overlaysContent = true;
    }

    let frameId = 0;

    const handleResize = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        setSize((previousSize) => {
          const nextSize = getWindowSize(baseline, virtualKeyboard);

          if (
            previousSize.width === nextSize.width &&
            previousSize.height === nextSize.height &&
            previousSize.visualHeight === nextSize.visualHeight &&
            previousSize.visualOffsetLeft === nextSize.visualOffsetLeft &&
            previousSize.visualOffsetTop === nextSize.visualOffsetTop &&
            previousSize.keyboardInset === nextSize.keyboardInset &&
            previousSize.isKeyboardOpen === nextSize.isKeyboardOpen
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
    virtualKeyboard?.addEventListener('geometrychange', handleResize);
    handleResize();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('resize', handleResize);
      viewport?.removeEventListener('resize', handleResize);
      viewport?.removeEventListener('scroll', handleResize);
      virtualKeyboard?.removeEventListener('geometrychange', handleResize);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--keyboard-fallback-inset',
      `${size.keyboardInset}px`,
    );
    document.documentElement.style.setProperty(
      '--visual-viewport-height',
      `${size.visualHeight}px`,
    );
    document.documentElement.style.setProperty(
      '--visual-viewport-offset-left',
      `${size.visualOffsetLeft}px`,
    );
    document.documentElement.style.setProperty(
      '--visual-viewport-offset-top',
      `${size.visualOffsetTop}px`,
    );

    return () => {
      document.documentElement.style.removeProperty('--keyboard-fallback-inset');
      document.documentElement.style.removeProperty('--visual-viewport-height');
      document.documentElement.style.removeProperty('--visual-viewport-offset-left');
      document.documentElement.style.removeProperty('--visual-viewport-offset-top');
    };
  }, [
    size.keyboardInset,
    size.visualHeight,
    size.visualOffsetLeft,
    size.visualOffsetTop,
  ]);

  return size;
}
