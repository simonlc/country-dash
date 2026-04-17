import { m } from '@/paraglide/messages.js';
import type { CountryProperties } from '@/types/game';
import { Panel } from '@/components/ui/Panel';
import { GuessInput } from './GuessInput';

interface GuessPanelProps {
  countryOptions: CountryProperties[];
  isCapitalMode: boolean;
  isKeyboardOpen: boolean;
  onSubmit: (term: string) => void;
}

export function GuessPanel({
  countryOptions,
  isCapitalMode,
  isKeyboardOpen,
  onSubmit,
}: GuessPanelProps) {
  return (
    <Panel
      compact
      edgeAttachment="bottom"
      maxWidth={720}
      spacing="compact"
      surface="elevated"
    >
      <p className={isKeyboardOpen ? 'text-sm font-semibold' : 'text-base font-semibold'}>
        {isCapitalMode
          ? m.game_guess_capital_prompt()
          : m.game_guess_country_prompt()}
      </p>
      <GuessInput
        options={countryOptions}
        variant={isCapitalMode ? 'capital' : 'country'}
        onSubmit={onSubmit}
      />
    </Panel>
  );
}
