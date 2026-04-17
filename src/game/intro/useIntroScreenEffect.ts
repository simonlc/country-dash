import NiceModal from '@ebay/nice-modal-react';
import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { IntroDialog } from '@/components/IntroDialog';
import {
  startDailyGameAtom,
  startRandomGameAtom,
} from '@/game/state/game-actions';
import {
  categoryCountsAtom,
  sizeCountsAtom,
} from '@/game/state/game-derived-atoms';
import {
  gameStateAtom,
  storedDailyResultAtom,
  worldDataAtom,
} from '@/game/state/game-atoms';
import type {
  CountrySizeFilter,
  GameMode,
  RegionFilter,
} from '@/types/game';

export function useIntroScreenEffect() {
  const worldData = useAtomValue(worldDataAtom);
  const gameState = useAtomValue(gameStateAtom);
  const sizeCounts = useAtomValue(sizeCountsAtom);
  const categoryCounts = useAtomValue(categoryCountsAtom);
  const storedDailyResult = useAtomValue(storedDailyResultAtom);
  const startDailyGame = useSetAtom(startDailyGameAtom);
  const startRandomGame = useSetAtom(startRandomGameAtom);

  useEffect(() => {
    if (!worldData || gameState.status !== 'intro') {
      return;
    }

    void NiceModal.show(IntroDialog, {
      categoryCounts,
      counts: sizeCounts,
      dailyResult: storedDailyResult,
      onStartDaily: () => {
        startDailyGame();
      },
      onStartRandom: (options: {
        mode: GameMode;
        regionFilter: RegionFilter | null;
        countrySizeFilter: CountrySizeFilter;
      }) => {
        startRandomGame(options);
      },
    });
  }, [
    categoryCounts,
    gameState.status,
    sizeCounts,
    startDailyGame,
    startRandomGame,
    storedDailyResult,
    worldData,
  ]);
}
