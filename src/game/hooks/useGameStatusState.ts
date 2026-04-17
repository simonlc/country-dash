import { useAtomValue } from 'jotai';
import { gameStateAtom, storedDailyResultAtom } from '@/game/state/game-atoms';
import {
  isCapitalModeAtom,
  isDailyRunAtom,
  isReviewCompleteAtom,
  totalRoundsAtom,
} from '@/game/state/game-derived-atoms';

export function useGameStatusState() {
  const gameState = useAtomValue(gameStateAtom);
  const isCapitalMode = useAtomValue(isCapitalModeAtom);
  const isDailyRun = useAtomValue(isDailyRunAtom);
  const isReviewComplete = useAtomValue(isReviewCompleteAtom);
  const totalRounds = useAtomValue(totalRoundsAtom);
  const storedDailyResult = useAtomValue(storedDailyResultAtom);

  return {
    gameState,
    isCapitalMode,
    isDailyRun,
    isReviewComplete,
    storedDailyResult,
    totalRounds,
  };
}
