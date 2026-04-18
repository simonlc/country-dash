import { useCallback, useEffect, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { localeAtom } from '@/i18n/state/i18n-atoms';
import { useDailyShare } from '@/hooks/useDailyShare';
import { GameStatusIntroContent } from '@/components/game-status/GameStatusIntroContent';
import { Panel } from '@/components/ui/Panel';
import {
  advanceRoundAtom,
  playAgainAtom,
  returnToMenuAtom,
} from '@/game/state/game-actions';
import {
  copyStateAtom,
  gameStateAtom,
  storedDailyResultAtom,
  todayDateKeyAtom,
} from '@/game/state/game-atoms';
import {
  currentCountryAtom,
  isCapitalModeAtom,
  isDailyRunAtom,
  isKeyboardOpenAtom,
  isReviewCompleteAtom,
  totalRoundsAtom,
} from '@/game/state/game-derived-atoms';
import { getCountryDisplayName } from '@/utils/countryNames';
import { EndRoundScreen } from './EndRoundScreen';
import { MidRoundScreen } from './MidRoundScreen';

export function RoundStatusScreen() {
  const gameState = useAtomValue(gameStateAtom);
  const isCapitalMode = useAtomValue(isCapitalModeAtom);
  const isDailyRun = useAtomValue(isDailyRunAtom);
  const isKeyboardOpen = useAtomValue(isKeyboardOpenAtom);
  const isReviewComplete = useAtomValue(isReviewCompleteAtom);
  const totalRounds = useAtomValue(totalRoundsAtom);
  const storedDailyResult = useAtomValue(storedDailyResultAtom);
  const todayDateKey = useAtomValue(todayDateKeyAtom);
  const locale = useAtomValue(localeAtom);
  const currentCountry = useAtomValue(currentCountryAtom);
  const copyState = useAtomValue(copyStateAtom);
  const setCopyState = useSetAtom(copyStateAtom);
  const advanceRound = useSetAtom(advanceRoundAtom);
  const playAgain = useSetAtom(playAgainAtom);
  const returnToMenu = useSetAtom(returnToMenuAtom);
  const currentCountryName = useMemo(
    () =>
      currentCountry
        ? getCountryDisplayName(currentCountry.properties, locale)
        : null,
    [currentCountry, locale],
  );
  const { dailyShareText } = useDailyShare({
    gameState,
    isDailyRun,
    locale,
    storedDailyResult,
    todayDateKey,
    totalRounds,
  });
  const onNextRound = useCallback(() => {
    advanceRound();
  }, [advanceRound]);
  const onPlayAgain = useCallback(() => {
    playAgain();
  }, [playAgain]);
  const onReturnToMenu = useCallback(() => {
    returnToMenu();
  }, [returnToMenu]);
  const onCopyDailyShare = useCallback(async () => {
    if (
      !dailyShareText ||
      typeof navigator === 'undefined' ||
      !navigator.clipboard
    ) {
      setCopyState('failed');
      return;
    }

    try {
      await navigator.clipboard.writeText(dailyShareText);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }, [dailyShareText, setCopyState]);
  useEffect(() => {
    if (copyState === 'idle') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState('idle');
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState, setCopyState]);
  const isReviewing =
    gameState.status === 'reviewing' && gameState.lastRound !== null;
  const isResultView = isReviewing || gameState.status === 'gameOver';
  const isDensePanel = isKeyboardOpen;
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
      {gameState.status === 'gameOver' ? (
        <EndRoundScreen
          copyState={copyState}
          dailyShareText={dailyShareText}
          gameState={gameState}
          isDailyRun={isDailyRun}
          onCopyDailyShare={onCopyDailyShare}
          onPlayAgain={onPlayAgain}
          onReturnToMenu={onReturnToMenu}
          totalRounds={totalRounds}
        />
      ) : isReviewing && gameState.lastRound ? (
        <MidRoundScreen
          currentCountryName={currentCountryName}
          gameState={gameState}
          isCapitalMode={isCapitalMode}
          isReviewComplete={isReviewComplete}
          onNextRound={onNextRound}
        />
      ) : (
        <GameStatusIntroContent storedDailyResult={storedDailyResult} />
      )}
    </Panel>
  );
}
