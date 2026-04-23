import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialGameState } from '@/utils/gameLogic';
import {
  gameSessionExpiryMs,
  gameSessionStorage,
  gameSessionStorageKey,
} from './game-persistence';

function createStorage() {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('game session persistence', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createStorage(),
    });
  });

  it('restores a recently persisted non-intro session', () => {
    const initialState = createInitialGameState();
    const playingState = {
      ...initialState,
      status: 'playing' as const,
    };

    gameSessionStorage.setItem(gameSessionStorageKey, playingState);

    expect(gameSessionStorage.getItem(gameSessionStorageKey, initialState)).toEqual(
      playingState,
    );
  });

  it('expires a stale persisted session after six hours', () => {
    const initialState = createInitialGameState();
    const reviewingState = {
      ...initialState,
      status: 'reviewing' as const,
    };

    window.localStorage.setItem(
      gameSessionStorageKey,
      JSON.stringify({
        persistedAt: Date.now() - gameSessionExpiryMs - 1,
        schemaVersion: 1,
        state: reviewingState,
      }),
    );

    expect(gameSessionStorage.getItem(gameSessionStorageKey, initialState)).toEqual(
      initialState,
    );
    expect(window.localStorage.getItem(gameSessionStorageKey)).toBeNull();
  });

  it('expires legacy persisted sessions without a timestamp', () => {
    const initialState = createInitialGameState();
    const playingState = {
      ...initialState,
      status: 'playing' as const,
    };

    window.localStorage.setItem(
      gameSessionStorageKey,
      JSON.stringify({
        schemaVersion: 1,
        state: playingState,
      }),
    );

    expect(gameSessionStorage.getItem(gameSessionStorageKey, initialState)).toEqual(
      initialState,
    );
    expect(window.localStorage.getItem(gameSessionStorageKey)).toBeNull();
  });
});
