import { m } from '@/paraglide/messages.js';
import { GameStatusReviewContent } from '@/components/game-status/GameStatusReviewContent';
import type { GameState } from '@/types/game';
import { formatElapsed } from '@/utils/gameLogic';
import { getLocalizedGeographyLabel } from '@/utils/geographyLabels';

interface MidRoundScreenProps {
  currentCountryName: string | null;
  gameState: GameState;
  isCapitalMode: boolean;
  isReviewComplete: boolean;
  onNextRound: () => void;
}

export function MidRoundScreen({
  currentCountryName,
  gameState,
  isCapitalMode,
  isReviewComplete,
  onNextRound,
}: MidRoundScreenProps) {
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
  const isCorrect = gameState.lastRound?.answerResult === 'correct';
  const statusColor = isCorrect ? 'secondary.main' : 'error.main';

  return (
    <GameStatusReviewContent
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
