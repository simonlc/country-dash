import Typography from '@mui/material/Typography';
import type { getThemeSurfaceStyles } from '@/app/theme';
import { m } from '@/paraglide/messages.js';
import type { CountryProperties } from '@/types/game';
import { Panel } from '@/components/ui/Panel';
import { GuessInput } from './GuessInput';

interface GuessPanelProps {
  countryOptions: CountryProperties[];
  isCapitalMode: boolean;
  isKeyboardOpen: boolean;
  onSubmit: (term: string) => void;
  panelSurface: ReturnType<typeof getThemeSurfaceStyles>;
}

export function GuessPanel({
  countryOptions,
  isCapitalMode,
  isKeyboardOpen,
  onSubmit,
  panelSurface,
}: GuessPanelProps) {
  return (
    <Panel
      compact
      edgeAttachment="bottom"
      maxWidth={720}
      panelSurface={panelSurface}
      spacing={1.1}
    >
      <Typography variant={isKeyboardOpen ? 'subtitle2' : 'h6'}>
        {isCapitalMode
          ? m.game_guess_capital_prompt()
          : m.game_guess_country_prompt()}
      </Typography>
      <GuessInput
        options={countryOptions}
        variant={isCapitalMode ? 'capital' : 'country'}
        onSubmit={onSubmit}
      />
    </Panel>
  );
}
