import { useMemo } from 'react';
import { m } from '@/paraglide/messages.js';
import { buildDailyShareText } from '@/utils/gameLogic';
import type { DailyChallengeResult, GameState } from '@/types/game';

interface UseDailyShareArgs {
  gameState: GameState;
  isDailyRun: boolean;
  locale: string;
  storedDailyResult: DailyChallengeResult | null;
  todayDateKey: string;
  totalRounds: number;
}

interface UseDailyShareResult {
  completedDailyResult: DailyChallengeResult | null;
  dailyShareText: string | null;
}

export function useDailyShare({
  gameState,
  isDailyRun,
  locale,
  storedDailyResult,
  todayDateKey,
  totalRounds,
}: UseDailyShareArgs): UseDailyShareResult {
  const completedDailyResult = useMemo(() => {
    if (gameState.dailyResult) {
      return gameState.dailyResult;
    }
    if (
      isDailyRun &&
      gameState.status === 'gameOver' &&
      gameState.rounds.length > 0
    ) {
      return {
        date: gameState.sessionConfig?.dateKey ?? todayDateKey,
        seed: gameState.sessionConfig?.seed ?? todayDateKey,
        completedAt: new Date().toISOString(),
        correctCount: gameState.correct,
        totalCount: gameState.rounds.length,
        rounds: gameState.rounds,
      };
    }

    return storedDailyResult;
  }, [
    gameState.correct,
    gameState.dailyResult,
    gameState.rounds,
    gameState.sessionConfig,
    gameState.status,
    isDailyRun,
    storedDailyResult,
    todayDateKey,
  ]);

  const dailyShareText = useMemo(() => {
    void locale;
    if (!isDailyRun || gameState.status !== 'gameOver') {
      return null;
    }
    if (completedDailyResult) {
      return buildDailyShareText(completedDailyResult, {
        scoreLabel: `${m.daily_share_score_label()}`,
        titlePrefix: `${m.daily_share_title_prefix()}`,
      });
    }

    const summary = [
      `🧭 ${m.daily_share_title_prefix().toString()} ${todayDateKey}`,
      `🌍 ${m.daily_share_score_label().toString()}: ${gameState.correct}/${totalRounds}`,
    ].join('\n');
    const emojiLine = gameState.rounds
      .map((round) => (round.answerResult === 'correct' ? '🟢' : '⚫'))
      .join('');

    return emojiLine ? `${summary}\n${emojiLine}` : summary;
  }, [
    completedDailyResult,
    gameState.correct,
    gameState.rounds,
    gameState.status,
    isDailyRun,
    locale,
    todayDateKey,
    totalRounds,
  ]);

  return {
    completedDailyResult,
    dailyShareText,
  };
}
