import { Panel } from '@/components/ui/Panel';
import { submitGuessAtom } from '@/game/state/game-actions';
import {
  countryOptionsAtom,
  isCapitalModeAtom,
} from '@/game/state/game-derived-atoms';
import { m } from '@/paraglide/messages.js';
import { useMediaQuery } from '@/components/ui/theme-provider';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { GuessInput } from './GuessInput';

// TODO: This component feels pretty thin, maybe inline
export function GuessPanel() {
  const countryOptionsValue = useAtomValue(countryOptionsAtom);
  const isCapitalModeValue = useAtomValue(isCapitalModeAtom);
  const submitGuess = useSetAtom(submitGuessAtom);
  const isMobileViewport = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const hasCoarsePointer = useMediaQuery('(pointer: coarse)');
  const useVirtualKeyboard = isMobileViewport && hasCoarsePointer;

  const handleSubmit = useCallback(
    (term: string) => {
      submitGuess(term);
    },
    [submitGuess],
  );

  return (
    <Panel compact maxWidth={720} surface="elevated">
      <p className="text-sm font-semibold">
        {isCapitalModeValue
          ? m.game_guess_capital_prompt()
          : m.game_guess_country_prompt()}
      </p>
      <GuessInput
        options={countryOptionsValue}
        useVirtualKeyboard={useVirtualKeyboard}
        variant={isCapitalModeValue ? 'capital' : 'country'}
        onSubmit={handleSubmit}
      />
    </Panel>
  );
}
