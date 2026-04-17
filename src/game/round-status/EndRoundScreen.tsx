import { m } from '@/paraglide/messages.js';
import { GameStatusGameOverContent } from '@/components/game-status/GameStatusGameOverContent';
import type { GameState } from '@/types/game';
import { formatElapsed } from '@/utils/gameLogic';

interface EndRoundScreenProps {
  copyState: 'idle' | 'copied' | 'failed';
  dailyShareText: string | null;
  gameState: GameState;
  isDailyRun: boolean;
  onCopyDailyShare: () => Promise<void>;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
  totalRounds: number;
}

export function EndRoundScreen({
  copyState,
  dailyShareText,
  gameState,
  isDailyRun,
  onCopyDailyShare,
  onPlayAgain,
  onReturnToMenu,
  totalRounds,
}: EndRoundScreenProps) {
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

  return (
    <GameStatusGameOverContent
      copyState={copyState}
      dailyShareText={dailyShareText}
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
