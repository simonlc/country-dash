import { useAtomValue } from 'jotai';
import { ThemeMenu } from '@/components/ThemeMenu';
import { GameHud } from '@/components/GameHud';
import { isKeyboardOpenAtom } from '@/game/state/game-derived-atoms';
import { useHudState } from './useHudState';

export function Hud() {
  const {
    displayElapsedMs,
    gameState,
    roundLabel,
    runningSince,
    sessionLabels,
    sessionModeLabel,
    sessionSummaryLabel,
  } = useHudState();
  const isKeyboardOpen = useAtomValue(isKeyboardOpenAtom);

  return (
    <GameHud
      correct={gameState.correct}
      displayElapsedMs={displayElapsedMs}
      incorrect={gameState.incorrect}
      isKeyboardOpen={isKeyboardOpen}
      livesRemaining={gameState.livesRemaining}
      roundLabel={roundLabel}
      runningSince={runningSince}
      score={gameState.score}
      sessionLabels={sessionLabels}
      sessionModeLabel={sessionModeLabel}
      sessionSummaryLabel={sessionSummaryLabel}
      streak={gameState.streak}
      topBarMenu={<ThemeMenu />}
    />
  );
}
