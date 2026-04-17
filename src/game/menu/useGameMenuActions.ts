import NiceModal from '@ebay/nice-modal-react';
import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { AboutDialog } from '@/components/AboutDialog';
import {
  playAgainAtom,
  refocusAtom,
  returnToMenuAtom,
} from '@/game/state/game-actions';

export function useGameMenuActions() {
  const requestRefocus = useSetAtom(refocusAtom);
  const playAgain = useSetAtom(playAgainAtom);
  const returnToMenu = useSetAtom(returnToMenuAtom);

  const onRefocus = useCallback(() => {
    requestRefocus();
  }, [requestRefocus]);

  const onRestart = useCallback(() => {
    playAgain();
  }, [playAgain]);

  const onQuit = useCallback(() => {
    returnToMenu();
  }, [returnToMenu]);

  const onAbout = useCallback(() => {
    void NiceModal.show(AboutDialog);
  }, []);

  return {
    onAbout,
    onQuit,
    onRefocus,
    onRestart,
  };
}
