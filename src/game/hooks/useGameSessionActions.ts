import NiceModal from '@ebay/nice-modal-react';
import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { AboutDialog } from '@/components/AboutDialog';
import type { CipherTrafficState } from '@/hooks/useCipherTraffic';
import {
  advanceRoundAtom,
  playAgainAtom,
  refocusAtom,
  returnToMenuAtom,
  submitGuessAtom,
} from '@/game/state/game-actions';
import {
  cipherTrafficStateAtom,
  copyStateAtom,
} from '@/game/state/game-atoms';

interface UseGameSessionActionsArgs {
  dailyShareText: string | null;
}

export function useGameSessionActions({ dailyShareText }: UseGameSessionActionsArgs) {
  const submitGuess = useSetAtom(submitGuessAtom);
  const advanceRound = useSetAtom(advanceRoundAtom);
  const requestRefocus = useSetAtom(refocusAtom);
  const playAgain = useSetAtom(playAgainAtom);
  const returnToMenu = useSetAtom(returnToMenuAtom);
  const setCopyState = useSetAtom(copyStateAtom);
  const setCipherTrafficState = useSetAtom(cipherTrafficStateAtom);

  const onSubmit = useCallback(
    (term: string) => {
      submitGuess(term);
    },
    [submitGuess],
  );

  const onNextRound = useCallback(() => {
    advanceRound();
  }, [advanceRound]);

  const onRefocus = useCallback(() => {
    requestRefocus();
  }, [requestRefocus]);

  const onPlayAgain = useCallback(() => {
    playAgain();
  }, [playAgain]);

  const onReturnToMenu = useCallback(() => {
    returnToMenu();
  }, [returnToMenu]);

  const onCopyDailyShare = useCallback(async () => {
    if (
      !dailyShareText ||
      typeof navigator === 'undefined' ||
      !navigator.clipboard
    ) {
      setCopyState('failed');
      return;
    }

    try {
      await navigator.clipboard.writeText(dailyShareText);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }, [dailyShareText, setCopyState]);

  const onCipherTrafficStateChange = useCallback(
    (nextState: CipherTrafficState) => {
      setCipherTrafficState(nextState);
    },
    [setCipherTrafficState],
  );

  const openAbout = useCallback(() => {
    void NiceModal.show(AboutDialog);
  }, []);

  return {
    onCipherTrafficStateChange,
    onCopyDailyShare,
    onNextRound,
    onPlayAgain,
    onRefocus,
    onReturnToMenu,
    onSubmit,
    openAbout,
  };
}
