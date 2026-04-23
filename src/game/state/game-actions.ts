import { atom } from 'jotai';
import type {
  CountrySizeFilter,
  GameMode,
  RegionFilter,
  SessionConfig,
} from '@/types/game';
import { loadWorldData } from '@/utils/loadWorldData';
import {
  buildSessionPlan,
  createRandomSeed,
  createSessionConfig,
  gameReducer,
  randomRunPresetDifficulties,
} from '@/utils/gameLogic';
import { currentCountryAtom } from './game-derived-atoms';
import {
  dailyResultAtomFamily,
  focusRequestAtom,
  gameStateAtom,
  loadingErrorAtom,
  storedDailyResultAtom,
  todayDateKeyAtom,
  worldDataAtom,
} from './game-atoms';

const dailyDifficulty = 'medium' as const;

export const loadWorldDataAtom = atom(
  null,
  async (get, set) => {
    if (get(worldDataAtom)) {
      return;
    }

    try {
      const worldData = await loadWorldData();
      set(worldDataAtom, worldData);
      set(loadingErrorAtom, null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load world data';
      set(loadingErrorAtom, message);
    }
  },
);

export const startSessionAtom = atom(
  null,
  (get, set, config: SessionConfig) => {
    const worldData = get(worldDataAtom);
    if (!worldData) {
      return;
    }

    const plan = buildSessionPlan(worldData.world, config);
    const nextState = gameReducer(get(gameStateAtom), {
      type: 'START_SESSION',
      config,
      plan,
      startedAt: Date.now(),
    });
    set(gameStateAtom, nextState);
    set(focusRequestAtom, (value) => value + 1);
  },
);

export const startRandomGameAtom = atom(
  null,
  (
    _get,
    set,
    options: {
      countrySizeFilter: CountrySizeFilter;
      mode: GameMode;
      regionFilter: RegionFilter | null;
    },
  ) => {
    const config = createSessionConfig({
      difficulty: options.regionFilter
        ? 'medium'
        : randomRunPresetDifficulties[options.countrySizeFilter],
      kind: 'random',
      mode: options.mode,
      regionFilter: options.regionFilter,
      countrySizeFilter: options.countrySizeFilter,
      seed: createRandomSeed(),
    });

    set(startSessionAtom, config);
  },
);

export const startDailyGameAtom = atom(
  null,
  (get, set) => {
    if (get(storedDailyResultAtom)) {
      return;
    }

    const todayDateKey = get(todayDateKeyAtom);
    const config = createSessionConfig({
      dateKey: todayDateKey,
      difficulty: dailyDifficulty,
      kind: 'daily',
      mode: 'classic',
      seed: todayDateKey,
    });

    set(startSessionAtom, config);
  },
);

export const submitGuessAtom = atom(
  null,
  (get, set, guess: string) => {
    const gameState = get(gameStateAtom);
    const currentCountry = get(currentCountryAtom);
    if (!currentCountry || gameState.status !== 'playing') {
      return;
    }

    const nextState = gameReducer(gameState, {
      type: 'SUBMIT_GUESS',
      country: currentCountry,
      guess,
      submittedAt: Date.now(),
    });
    set(gameStateAtom, nextState);
  },
);

export const advanceRoundAtom = atom(
  null,
  (get, set) => {
    const nextState = gameReducer(get(gameStateAtom), {
      type: 'ADVANCE_ROUND',
      startedAt: Date.now(),
    });
    set(gameStateAtom, nextState);
  },
);

export const returnToMenuAtom = atom(
  null,
  (get, set) => {
    const nextState = gameReducer(get(gameStateAtom), {
      type: 'RETURN_TO_MENU',
    });
    set(gameStateAtom, nextState);
  },
);

export const playAgainAtom = atom(
  null,
  (get, set) => {
    const config = get(gameStateAtom).sessionConfig;
    if (!config) {
      return;
    }

    const nextConfig = createSessionConfig({
      difficulty: config.selectedDifficulty,
      kind: 'random',
      mode: config.mode,
      regionFilter: config.regionFilter,
      countrySizeFilter: config.countrySizeFilter,
      seed: createRandomSeed(),
    });
    set(startSessionAtom, nextConfig);
  },
);

export const refocusAtom = atom(
  null,
  (_get, set) => {
    set(focusRequestAtom, (value) => value + 1);
  },
);

export const syncStoredDailyResultAtom = atom(
  null,
  (get, set) => {
    const dailyResult = get(gameStateAtom).dailyResult;
    if (!dailyResult) {
      return;
    }

    set(dailyResultAtomFamily(dailyResult.date), dailyResult);
  },
);
