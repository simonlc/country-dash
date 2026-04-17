import { Panel } from '@/components/ui/Panel';
import { EndRoundScreen } from './EndRoundScreen';
import { IntroScreen } from './IntroScreen';
import { MidRoundScreen } from './MidRoundScreen';
import { useRoundStatusState } from './useRoundStatusState';

export function RoundStatusScreen() {
  const state = useRoundStatusState();
  const isReviewing =
    state.gameState.status === 'reviewing' && state.gameState.lastRound !== null;
  const isResultView = isReviewing || state.gameState.status === 'gameOver';
  const isDensePanel = state.isKeyboardOpen;
  const panelSpacing = isResultView ? 'compact' : isDensePanel ? 'compact' : 'roomy';

  return (
    <Panel
      compact={isDensePanel}
      edgeAttachment={isResultView ? 'bottom' : 'none'}
      flat={isResultView}
      maxWidth={560}
      surface="elevated"
      spacing={panelSpacing}
    >
      {state.gameState.status === 'gameOver' ? (
        <EndRoundScreen
          copyState={state.copyState}
          dailyShareText={state.dailyShareText}
          gameState={state.gameState}
          isDailyRun={state.isDailyRun}
          onCopyDailyShare={state.onCopyDailyShare}
          onPlayAgain={state.onPlayAgain}
          onReturnToMenu={state.onReturnToMenu}
          totalRounds={state.totalRounds}
        />
      ) : isReviewing && state.gameState.lastRound ? (
        <MidRoundScreen
          currentCountryName={state.currentCountryName}
          gameState={state.gameState}
          isCapitalMode={state.isCapitalMode}
          isReviewComplete={state.isReviewComplete}
          onNextRound={state.onNextRound}
        />
      ) : (
        <IntroScreen storedDailyResult={state.storedDailyResult} />
      )}
    </Panel>
  );
}
