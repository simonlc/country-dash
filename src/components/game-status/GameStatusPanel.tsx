import type { Theme } from '@mui/material/styles';
import type {
  getThemeDisplaySurfaceStyles,
  getThemeSurfaceStyles,
} from '@/app/theme';
import { m } from '@/paraglide/messages.js';
import { Panel } from '@/components/ui/Panel';
import { formatElapsed } from '@/utils/gameLogic';
import { getLocalizedGeographyLabel } from '@/utils/geographyLabels';
import type { GameState } from '@/types/game';
import { GameStatusGameOverContent } from './GameStatusGameOverContent';
import { GameStatusIntroContent } from './GameStatusIntroContent';
import { GameStatusReviewContent } from './GameStatusReviewContent';

interface GameStatusPanelProps {
  copyState: 'idle' | 'copied' | 'failed';
  currentCountryName: string | null;
  dailyShareText: string | null;
  displaySurface: ReturnType<typeof getThemeDisplaySurfaceStyles>;
  gameState: GameState;
  isCapitalMode: boolean;
  isDailyRun: boolean;
  isKeyboardOpen: boolean;
  isReviewComplete: boolean;
  onCopyDailyShare: () => Promise<void>;
  onNextRound: () => void;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
  panelSurface: ReturnType<typeof getThemeSurfaceStyles>;
  storedDailyResult: {
    correctCount: number;
    totalCount: number;
  } | null;
  totalRounds: number;
}

export function GameStatusPanel({
  copyState,
  currentCountryName,
  dailyShareText,
  displaySurface,
  gameState,
  isCapitalMode,
  isDailyRun,
  isKeyboardOpen,
  isReviewComplete,
  onCopyDailyShare,
  onNextRound,
  onPlayAgain,
  onReturnToMenu,
  panelSurface,
  storedDailyResult,
  totalRounds,
}: GameStatusPanelProps) {
  const isReviewing =
    gameState.status === 'reviewing' && gameState.lastRound !== null;
  const isResultView = isReviewing || gameState.status === 'gameOver';
  const reviewAnswer = gameState.lastRound
    ? isCapitalMode
      ? (gameState.lastRound.capitalName ??
        currentCountryName ??
        gameState.lastRound.countryName)
      : (currentCountryName ?? gameState.lastRound.countryName)
    : '';
  const reviewMetadata = gameState.lastRound
    ? [
        isCapitalMode
          ? (currentCountryName ?? gameState.lastRound.countryName)
          : null,
        getLocalizedGeographyLabel(gameState.lastRound.continent),
        getLocalizedGeographyLabel(gameState.lastRound.subregion),
      ]
        .filter((value): value is string => Boolean(value))
        .join(' • ')
    : '';
  const playerGuess = gameState.lastRound?.playerGuess.trim() || m.game_no_answer();
  const showPlayerGuess =
    gameState.lastRound?.answerResult === 'incorrect' ||
    playerGuess === m.game_no_answer();
  const reviewStats = gameState.lastRound
    ? [
        {
          label: m.game_stat_time(),
          value: formatElapsed(gameState.lastRound.roundElapsedMs),
        },
        {
          label: m.game_stat_score(),
          value: `${gameState.lastRound.scoreDelta >= 0 ? '+' : ''}${
            gameState.lastRound.scoreDelta
          }`,
        },
      ]
    : [];
  const gameOverSummary = isDailyRun
    ? m.game_correct_today({ correct: gameState.correct, total: totalRounds })
    : m.game_correct({ correct: gameState.correct, total: totalRounds });
  const gameOverMeta = isDailyRun
    ? m.game_meta_daily({
        bestStreak: gameState.bestStreak,
        elapsed: formatElapsed(gameState.totalElapsedMs),
      })
    : m.game_meta_random({
        bestStreak: gameState.bestStreak,
        elapsed: formatElapsed(gameState.totalElapsedMs),
        score: gameState.score,
      });
  const isCorrect = gameState.lastRound?.answerResult === 'correct';
  const statusColor = isCorrect ? 'primary.main' : 'error.main';
  const dividerColor = (theme: Theme) =>
    theme.vars?.palette.divider ?? theme.palette.divider;
  const isDensePanel = isKeyboardOpen;
  const panelSpacing = isResultView ? 1.1 : isDensePanel ? 1.1 : 2;

  const renderStateContent = () => {
    if (gameState.status === 'gameOver') {
      return (
        <GameStatusGameOverContent
          copyState={copyState}
          dailyShareText={dailyShareText}
          displaySurface={displaySurface}
          dividerColor={dividerColor}
          gameOverMeta={gameOverMeta}
          gameOverSummary={gameOverSummary}
          gameState={gameState}
          isDailyRun={isDailyRun}
          onCopyDailyShare={onCopyDailyShare}
          onPlayAgain={onPlayAgain}
          onReturnToMenu={onReturnToMenu}
        />
      );
    }

    if (isReviewing && gameState.lastRound) {
      return (
        <GameStatusReviewContent
          dividerColor={dividerColor}
          isCorrect={isCorrect}
          isReviewComplete={isReviewComplete}
          onNextRound={onNextRound}
          playerGuess={playerGuess}
          reviewAnswer={reviewAnswer}
          reviewMetadata={reviewMetadata}
          reviewStats={reviewStats}
          showPlayerGuess={showPlayerGuess}
          statusColor={statusColor}
        />
      );
    }

    return <GameStatusIntroContent storedDailyResult={storedDailyResult} />;
  };

  return (
    <Panel
      compact={isDensePanel}
      edgeAttachment={isResultView ? 'bottom' : 'none'}
      flat={isResultView}
      maxWidth={560}
      panelSurface={panelSurface}
      spacing={panelSpacing}
    >
      {renderStateContent()}
    </Panel>
  );
}
