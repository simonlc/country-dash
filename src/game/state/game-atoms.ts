import { atom } from 'jotai';
import { atomFamily, atomWithStorage } from 'jotai/utils';
import type { CipherTrafficState } from '@/hooks/useCipherTraffic';
import type {
  DailyChallengeResult,
  GameState,
  WorldData,
} from '@/types/game';
import {
  createInitialGameState,
  formatDailyStorageKey,
  getTodayDateKey,
} from '@/utils/gameLogic';
import {
  gameSessionStorage,
  gameSessionStorageKey,
} from './game-persistence';

interface BrowserStorage {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
}

export interface GameViewportState {
  height: number;
  keyboardInset: number;
  isKeyboardOpen: boolean;
  visualHeight: number;
  width: number;
}

function getInitialViewportState(): GameViewportState {
  if (typeof window === 'undefined') {
    return {
      height: 0,
      keyboardInset: 0,
      isKeyboardOpen: false,
      visualHeight: 0,
      width: 0,
    };
  }

  const width = Math.round(document.documentElement.clientWidth || window.innerWidth);
  const height = Math.round(document.documentElement.clientHeight || window.innerHeight);

  return {
    height,
    keyboardInset: 0,
    isKeyboardOpen: false,
    visualHeight: height,
    width,
  };
}

function getBrowserStorage(): BrowserStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storage = window.localStorage as Partial<BrowserStorage>;
  if (
    typeof storage.getItem !== 'function' ||
    typeof storage.setItem !== 'function' ||
    typeof storage.removeItem !== 'function'
  ) {
    return null;
  }

  return storage as BrowserStorage;
}

function createDailyResultStorage() {
  return {
    getItem(key: string, initialValue: DailyChallengeResult | null) {
      const storage = getBrowserStorage();
      if (!storage) {
        return initialValue;
      }

      const rawValue = storage.getItem(key);
      if (!rawValue) {
        return initialValue;
      }

      try {
        return JSON.parse(rawValue) as DailyChallengeResult;
      } catch {
        storage.removeItem(key);
        return initialValue;
      }
    },
    removeItem(key: string) {
      const storage = getBrowserStorage();
      if (!storage) {
        return;
      }

      storage.removeItem(key);
    },
    setItem(key: string, value: DailyChallengeResult | null) {
      const storage = getBrowserStorage();
      if (!storage) {
        return;
      }

      if (!value) {
        storage.removeItem(key);
        return;
      }

      storage.setItem(key, JSON.stringify(value));
    },
  };
}

export const emptyCipherTrafficState: CipherTrafficState = {
  cacheAgeMs: null,
  errorMessage: null,
  source: 'disabled',
  status: 'disabled',
  tracks: [],
  updatedAtMs: null,
};

export const todayDateKeyAtom = atom(getTodayDateKey());

export const gameStateAtom = atomWithStorage<GameState>(
  gameSessionStorageKey,
  createInitialGameState(),
  gameSessionStorage,
  {
    getOnInit: true,
  },
);

export const worldDataAtom = atom<WorldData | null>(null);
export const loadingErrorAtom = atom<string | null>(null);
export const focusRequestAtom = atom(0);
export const copyStateAtom = atom<'copied' | 'failed' | 'idle'>('idle');
export const cipherTrafficStateAtom = atom<CipherTrafficState>(
  emptyCipherTrafficState,
);
export const bottomOverlayHeightAtom = atom(0);
export const viewportStateAtom = atom<GameViewportState>(getInitialViewportState());

export const dailyResultAtomFamily = atomFamily((dateKey: string) =>
  atomWithStorage<DailyChallengeResult | null>(
    formatDailyStorageKey(dateKey),
    null,
    createDailyResultStorage(),
    {
      getOnInit: true,
    },
  ),
);

export const storedDailyResultAtom = atom(
  (get) => {
    const dateKey = get(todayDateKeyAtom);
    return get(dailyResultAtomFamily(dateKey));
  },
  (get, set, nextValue: DailyChallengeResult | null) => {
    const dateKey = get(todayDateKeyAtom);
    set(dailyResultAtomFamily(dateKey), nextValue);
  },
);
