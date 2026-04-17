import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import type { GameState } from '@/types/game';
import { GameStatusPanel } from './GameStatusPanel';

function createGameState(overrides: Partial<GameState>): GameState {
  return {
    bestStreak: 0,
    correct: 0,
    countrySizeFilter: 'mixed',
    currentCountryId: null,
    currentRoundElapsedMs: 0,
    currentRoundStartedAt: null,
    dailyResult: null,
    effectiveDifficulty: 'easy',
    hintsUsedThisRound: 0,
    incorrect: 0,
    lastRound: null,
    livesRemaining: null,
    missedCountryIds: [],
    missStreak: 0,
    mode: 'classic',
    regionFilter: null,
    reviewQueue: [],
    roundIndex: 0,
    rounds: [],
    score: 0,
    selectedDifficulty: 'easy',
    sessionConfig: null,
    sessionPlan: null,
    status: 'intro',
    streak: 0,
    totalElapsedMs: 0,
    usedCountryIds: [],
    ...overrides,
  };
}

const baseProps = {
  copyState: 'idle' as const,
  currentCountryName: 'Canada',
  dailyShareText: null,
  isCapitalMode: false,
  isDailyRun: false,
  isKeyboardOpen: false,
  isReviewComplete: false,
  onCopyDailyShare: vi.fn().mockResolvedValue(undefined),
  onNextRound: vi.fn(),
  onPlayAgain: vi.fn(),
  onReturnToMenu: vi.fn(),
  storedDailyResult: null,
  totalRounds: 5,
};

describe('GameStatusPanel', () => {
  it('renders the intro branch', () => {
    renderWithProviders(
      <GameStatusPanel
        {...baseProps}
        gameState={createGameState({ status: 'intro' })}
      />,
    );

    expect(screen.getByText(/choose a run to begin/i)).toBeVisible();
  });

  it('renders the reviewing branch', () => {
    renderWithProviders(
      <GameStatusPanel
        {...baseProps}
        gameState={createGameState({
          lastRound: {
            answerResult: 'correct',
            capitalName: 'Ottawa',
            continent: 'North America',
            countryId: 'CA',
            countryName: 'Canada',
            effectiveDifficulty: 'easy',
            hintsUsed: 1,
            playerGuess: 'Canada',
            region: 'North America',
            roundElapsedMs: 1200,
            scoreDelta: 80,
            subregion: 'Northern America',
          },
          status: 'reviewing',
        })}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Correct');
    expect(screen.queryByText(/^Your guess$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Hints$/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^next$/i })).toBeVisible();
  });

  it('keeps the review action button keyboard-focusable', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <GameStatusPanel
        {...baseProps}
        gameState={createGameState({
          lastRound: {
            answerResult: 'incorrect',
            capitalName: null,
            continent: 'North America',
            countryId: 'CA',
            countryName: 'Canada',
            effectiveDifficulty: 'easy',
            hintsUsed: 0,
            playerGuess: 'Atlantis',
            region: 'North America',
            roundElapsedMs: 1500,
            scoreDelta: -20,
            subregion: 'Northern America',
          },
          status: 'reviewing',
        })}
      />,
    );

    const actionButton = screen.getAllByRole('button', { name: /^next$/i })[0]!;
    await user.tab();
    actionButton.focus();
    expect(actionButton).toHaveFocus();
  });

  it('renders the game over branch', () => {
    renderWithProviders(
      <GameStatusPanel
        {...baseProps}
        gameState={createGameState({
          bestStreak: 3,
          correct: 4,
          score: 320,
          status: 'gameOver',
          totalElapsedMs: 45_000,
        })}
      />,
    );

    expect(screen.getByText(/run complete/i)).toBeVisible();
    expect(screen.getByText(/4\/5 correct/i)).toBeVisible();
    expect(screen.getByText(/320 points/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /play again/i })).toBeVisible();
  });
});
