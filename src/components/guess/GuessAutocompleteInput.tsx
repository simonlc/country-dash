import { designTokens } from '@/app/designSystem';
import { m } from '@/paraglide/messages.js';
import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

interface GuessAutocompleteInputProps {
  hintSuffix: string;
  inputValue: string;
  params: AutocompleteRenderInputParams;
  variant: 'country' | 'capital';
}

function getGuessLabel(variant: 'country' | 'capital') {
  return variant === 'capital'
    ? m.game_guess_label_capital()
    : m.game_guess_label_country();
}

function getGuessPlaceholder(variant: 'country' | 'capital') {
  return variant === 'capital'
    ? m.game_guess_placeholder_capital()
    : m.game_guess_placeholder_country();
}

export function GuessAutocompleteInput({
  hintSuffix,
  inputValue,
  params,
  variant,
}: GuessAutocompleteInputProps) {
  return (
    <div style={{ position: 'relative' }}>
      <TextField
        {...params}
        autoFocus
        autoComplete="off"
        label={getGuessLabel(variant)}
        inputProps={{
          ...params.inputProps,
          autoCapitalize: 'none',
          autoCorrect: 'off',
          enterKeyHint: 'done',
          inputMode: 'search',
        }}
        placeholder={getGuessPlaceholder(variant)}
        spellCheck={false}
        sx={{
          '& .MuiInputLabel-root': {
            fontWeight: designTokens.fontWeight.semibold,
          },
          '& .MuiInputBase-input': {
            fontSize: { md: designTokens.fontSize.md, xs: '1rem' },
            fontWeight: designTokens.fontWeight.semibold,
            py: 1.5,
          },
        }}
      />
      <Typography
        aria-hidden
        sx={{
          alignItems: 'center',
          color: 'text.secondary',
          display: hintSuffix ? 'flex' : 'none',
          fontSize: designTokens.fontSize.md,
          fontWeight: designTokens.fontWeight.semibold,
          inset: 0,
          lineHeight: designTokens.lineHeight.base,
          overflow: 'hidden',
          pointerEvents: 'none',
          position: 'absolute',
          px: '14px',
          py: 1.5,
          whiteSpace: 'pre',
          zIndex: 1,
        }}
      >
        <Box component="span" sx={{ visibility: 'hidden' }}>
          {inputValue}
        </Box>
        <Box component="span">{hintSuffix}</Box>
      </Typography>
    </div>
  );
}
