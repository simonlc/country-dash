import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { GuessPanel } from '@/components/guess/GuessPanel';
import { submitGuessAtom } from '@/game/state/game-actions';
import {
  countryOptionsAtom,
  isCapitalModeAtom,
  isKeyboardOpenAtom,
} from '@/game/state/game-derived-atoms';

export function GuessInputScreen() {
  const countryOptions = useAtomValue(countryOptionsAtom);
  const isCapitalMode = useAtomValue(isCapitalModeAtom);
  const isKeyboardOpen = useAtomValue(isKeyboardOpenAtom);
  const submitGuess = useSetAtom(submitGuessAtom);
  const onSubmit = useCallback(
    (term: string) => {
      submitGuess(term);
    },
    [submitGuess],
  );

  return (
    <GuessPanel
      countryOptions={countryOptions}
      isCapitalMode={isCapitalMode}
      isKeyboardOpen={isKeyboardOpen}
      onSubmit={onSubmit}
    />
  );
}
