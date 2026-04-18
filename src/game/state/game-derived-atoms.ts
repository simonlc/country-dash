import { atom } from 'jotai';
import type { CountryProperties, RegionFilter } from '@/types/game';
import { regionFilters } from '@/utils/labelTranslations';
import {
  buildRegionCountryPool,
  getRandomRunCountryCount,
} from '@/utils/gameLogic';
import { gameStateAtom, viewportStateAtom, worldDataAtom } from './game-atoms';

export const countryPoolAtom = atom(
  (get) => get(worldDataAtom)?.world.features ?? [],
);

export const countryFeaturesByIdAtom = atom((get) => {
  const countryPool = get(countryPoolAtom);
  return new Map(countryPool.map((country) => [country.id, country] as const));
});

export const currentCountryAtom = atom((get) => {
  const countryPool = get(countryPoolAtom);
  const currentCountryId = get(gameStateAtom).currentCountryId;
  if (!currentCountryId) {
    return countryPool[0] ?? null;
  }

  const countryById = get(countryFeaturesByIdAtom);
  return countryById.get(currentCountryId) ?? countryPool[0] ?? null;
});

export const countryOptionsAtom = atom<CountryProperties[]>((get) => {
  const worldData = get(worldDataAtom);
  if (!worldData) {
    return [];
  }

  return worldData.world.features.map((feature) => feature.properties);
});

export const totalRoundsAtom = atom(
  (get) => get(gameStateAtom).sessionPlan?.totalRounds ?? 0,
);

export const displayElapsedMsAtom = atom(
  (get) => get(gameStateAtom).totalElapsedMs,
);

export const runningSinceAtom = atom((get) => {
  const gameState = get(gameStateAtom);
  return gameState.status === 'playing'
    ? gameState.currentRoundStartedAt
    : null;
});

export const isDailyRunAtom = atom(
  (get) => get(gameStateAtom).sessionConfig?.kind === 'daily',
);

export const isCapitalModeAtom = atom(
  (get) => get(gameStateAtom).sessionConfig?.mode === 'capitals',
);

export const gameModeAtom = atom((get) => {
  const gameState = get(gameStateAtom);
  return gameState.sessionConfig?.mode ?? gameState.mode;
});

export const roundIndexAtom = atom((get) => get(gameStateAtom).roundIndex);

export const sizeCountsAtom = atom((get) => {
  const countryPool = get(countryPoolAtom);
  return {
    large: getRandomRunCountryCount(countryPool.length, 'large'),
    mixed: getRandomRunCountryCount(countryPool.length, 'mixed'),
    small: getRandomRunCountryCount(countryPool.length, 'small'),
  };
});

export const categoryCountsAtom = atom((get) => {
  const countryPool = get(countryPoolAtom);
  return regionFilters.reduce(
    (counts, regionFilter) => {
      counts[regionFilter] = buildRegionCountryPool(
        countryPool,
        regionFilter,
      ).length;
      return counts;
    },
    {} as Record<RegionFilter, number>,
  );
});

export const isReviewCompleteAtom = atom((get) => {
  const gameState = get(gameStateAtom);
  const totalRounds = get(totalRoundsAtom);

  return (
    gameState.status === 'reviewing' &&
    ((gameState.sessionConfig?.mode === 'streak' &&
      gameState.lastRound?.answerResult === 'incorrect') ||
      (gameState.sessionConfig?.mode === 'threeLives' &&
        (gameState.livesRemaining ?? 1) <= 0) ||
      gameState.roundIndex + 1 >= totalRounds)
  );
});

export const isKeyboardOpenAtom = atom(
  (get) => get(viewportStateAtom).isKeyboardOpen,
);

export const viewportVisualHeightAtom = atom(
  (get) => get(viewportStateAtom).visualHeight,
);

export const viewportWidthAtom = atom((get) => get(viewportStateAtom).width);
