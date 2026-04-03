import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  appThemes,
  getThemeDisplaySurfaceStyles,
  getThemeSurfaceStyles,
} from '@/app/theme';
import { renderWithProviders } from '@/test/render';
import { GameStatusPanel } from './GameStatusPanel';
import type { GameState } from '@/types/game';

const activeTheme = appThemes[0]!;
const panelSurface = getThemeSurfaceStyles(activeTheme, 'panel');
const displaySurface = getThemeDisplaySurfaceStyles(activeTheme, 'neutral');

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
  countryOptions: [
    {
      isocode: 'CA',
      isocode3: 'CAN',
      nameEn: 'Canada',
    },
  ],
  dailyShareText: null,
  displaySurface,
  isCapitalMode: false,
  isDailyRun: false,
  isReviewComplete: false,
  onCopyDailyShare: vi.fn().mockResolvedValue(undefined),
  onNextRound: vi.fn(),
  onPlayAgain: vi.fn(),
  onReturnToMenu: vi.fn(),
  onSubmit: vi.fn(),
  panelSurface,
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

  it('renders the playing branch', () => {
    renderWithProviders(
      <GameStatusPanel
        {...baseProps}
        gameState={createGameState({ status: 'playing' })}
      />,
    );

    expect(screen.getByText(/guess the highlighted country/i)).toBeVisible();
    expect(screen.getByLabelText(/guess the country/i)).toBeVisible();
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
