import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { m } from '@/paraglide/messages.js';
import { submitGuessAtom } from '@/game/state/game-actions';
import {
  countryOptionsAtom,
  isCapitalModeAtom,
  isKeyboardOpenAtom,
} from '@/game/state/game-derived-atoms';
import type { CountryProperties } from '@/types/game';
import { Panel } from '@/components/ui/Panel';
import { GuessInput } from './GuessInput';

interface GuessPanelProps {
  countryOptions?: CountryProperties[];
  isCapitalMode?: boolean;
  isKeyboardOpen?: boolean;
  onSubmit?: (term: string) => void;
}

export function GuessPanel({
  countryOptions,
  isCapitalMode,
  isKeyboardOpen,
  onSubmit,
}: GuessPanelProps) {
  const countryOptionsValue = useAtomValue(countryOptionsAtom);
  const isCapitalModeValue = useAtomValue(isCapitalModeAtom);
  const isKeyboardOpenValue = useAtomValue(isKeyboardOpenAtom);
  const submitGuess = useSetAtom(submitGuessAtom);
  const resolvedCountryOptions = countryOptions ?? countryOptionsValue;
  const resolvedIsCapitalMode = isCapitalMode ?? isCapitalModeValue;
  const resolvedIsKeyboardOpen = isKeyboardOpen ?? isKeyboardOpenValue;
  const handleSubmit = useCallback(
    (term: string) => {
      if (onSubmit) {
        onSubmit(term);
        return;
      }
      submitGuess(term);
    },
    [onSubmit, submitGuess],
  );

  return (
    <Panel
      compact
      edgeAttachment="bottom"
      maxWidth={720}
      spacing="compact"
      surface="elevated"
    >
      <p className={resolvedIsKeyboardOpen ? 'text-sm font-semibold' : 'text-base font-semibold'}>
        {resolvedIsCapitalMode
          ? m.game_guess_capital_prompt()
          : m.game_guess_country_prompt()}
      </p>
      <GuessInput
        options={resolvedCountryOptions}
        variant={resolvedIsCapitalMode ? 'capital' : 'country'}
        onSubmit={handleSubmit}
      />
    </Panel>
  );
}
