import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useWindowSize } from '@/hooks/useWindowSize';
import { viewportStateAtom } from '@/game/state/game-atoms';

export function useViewportStateSync() {
  const size = useWindowSize();
  const setViewportState = useSetAtom(viewportStateAtom);

  useEffect(() => {
    setViewportState({
      height: size.height,
      isKeyboardOpen: size.isKeyboardOpen,
      visualHeight: size.visualHeight,
      width: size.width,
    });
  }, [
    setViewportState,
    size.height,
    size.isKeyboardOpen,
    size.visualHeight,
    size.width,
  ]);
}
