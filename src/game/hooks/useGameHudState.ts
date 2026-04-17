import { useAtomValue } from 'jotai';
import { m } from '@/paraglide/messages.js';
import { gameStateAtom } from '@/game/state/game-atoms';
import {
  displayElapsedMsAtom,
  runningSinceAtom,
  totalRoundsAtom,
} from '@/game/state/game-derived-atoms';
import {
  getCountrySizeLabel,
  getModeLabel,
  getRegionLabel,
  getSessionTypeLabel,
} from '@/utils/labelTranslations';
import type { GameState } from '@/types/game';

function getSessionSummaryLabel(gameState: GameState) {
  if (!gameState.sessionConfig) {
    return '';
  }

  if (gameState.sessionConfig.kind === 'daily') {
    return `${m.pool_global()}`;
  }

  if (gameState.regionFilter) {
    return getRegionLabel(gameState.regionFilter);
  }

  return getCountrySizeLabel(gameState.countrySizeFilter);
}

function getSessionModeLabel(gameState: GameState) {
  if (!gameState.sessionConfig) {
    return `${m.session_mode_none()}`;
  }

  return getModeLabel(gameState.sessionConfig.mode);
}

export function useGameHudState() {
  const gameState = useAtomValue(gameStateAtom);
  const totalRounds = useAtomValue(totalRoundsAtom);
  const displayElapsedMs = useAtomValue(displayElapsedMsAtom);
  const runningSince = useAtomValue(runningSinceAtom);
  const sessionModeLabel = getSessionModeLabel(gameState);
  const sessionSummaryLabel = getSessionSummaryLabel(gameState);
  const roundLabel =
    gameState.status === 'intro'
      ? `${m.game_round_ready()}`
      : `${m.game_round({
          current: gameState.roundIndex + 1,
          total: totalRounds,
        })}`;

  const sessionLabels = [
    `${m.session_label_type({
      value: getSessionTypeLabel(gameState.sessionConfig?.kind ?? null),
    })}`,
    `${m.session_label_mode({ value: sessionModeLabel })}`,
    sessionSummaryLabel
      ? `${m.session_label_pool({ value: sessionSummaryLabel })}`
      : null,
  ].filter((value): value is string => Boolean(value));

  return {
    displayElapsedMs,
    roundLabel,
    runningSince,
    sessionLabels,
    sessionModeLabel,
    sessionSummaryLabel,
  };
}
