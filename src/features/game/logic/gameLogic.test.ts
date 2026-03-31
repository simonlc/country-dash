import { describe, expect, it } from 'vitest';
import {
  createInitialGameState,
  isCorrectGuess,
  nextRoundIndex,
} from '@/features/game/logic/gameLogic';

describe('gameLogic', () => {
  it('matches guesses case-insensitively', () => {
    expect(isCorrectGuess('canada', 'Canada')).toBe(true);
  });

  it('returns null when the game is over', () => {
    expect(nextRoundIndex(4, 5)).toBe(null);
  });

  it('creates a typed default state', () => {
    expect(createInitialGameState()).toEqual({
      answerResult: null,
      correct: 0,
      difficulty: 'hard',
      elapsedMs: 0,
      incorrect: 0,
      roundIndex: 0,
      status: 'intro',
      streak: 0,
    });
  });
});
