import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  loadWorldDataAtom,
  syncStoredDailyResultAtom,
} from '@/game/state/game-actions';
import { gameStateAtom } from '@/game/state/game-atoms';
import { useIntroScreenEffect } from '@/game/intro/useIntroScreenEffect';

export function useGameSessionEffects() {
  const gameState = useAtomValue(gameStateAtom);
  const loadWorldData = useSetAtom(loadWorldDataAtom);
  const syncStoredDailyResult = useSetAtom(syncStoredDailyResultAtom);

  useIntroScreenEffect();

  useEffect(() => {
    void loadWorldData();
  }, [loadWorldData]);

  useEffect(() => {
    if (!gameState.dailyResult) {
      return;
    }

    syncStoredDailyResult();
  }, [gameState.dailyResult, syncStoredDailyResult]);
}
