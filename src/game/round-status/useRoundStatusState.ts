import { useCallback, useEffect, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { localeAtom } from '@/i18n/state/i18n-atoms';
import { useDailyShare } from '@/hooks/useDailyShare';
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

export function useRoundStatusState() {
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

  return {
    copyState,
    currentCountryName,
    dailyShareText,
    gameState,
    isCapitalMode,
    isDailyRun,
    isKeyboardOpen,
    isReviewComplete,
    onCopyDailyShare,
    onNextRound,
    onPlayAgain,
    onReturnToMenu,
    storedDailyResult,
    totalRounds,
  };
}
