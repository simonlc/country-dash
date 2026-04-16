import Box from '@mui/material/Box';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import type { HTMLAttributes } from 'react';
import { UiCard } from '@/components/ui/UiCard';
import type { HighlightPart, GuessChoice } from './types';

interface GuessAutocompleteOptionProps {
  highlightedChoiceId: string | null;
  inputValue: string;
  option: GuessChoice;
  optionProps: HTMLAttributes<HTMLLIElement>;
}

export function GuessAutocompleteOption({
  highlightedChoiceId,
  inputValue,
  option,
  optionProps,
}: GuessAutocompleteOptionProps) {
  const matches = match(option.label, inputValue, {
    insideWords: true,
  });
  const parts = parse(option.label, matches) as HighlightPart[];
  const isHighlighted = highlightedChoiceId === option.id;

  return (
    <Box
      component="li"
      {...optionProps}
      sx={{
        '&.MuiAutocomplete-option': {
          alignItems: 'center',
          backgroundColor: 'transparent',
        },
        '&.MuiAutocomplete-option.Mui-focused': {
          backgroundColor: 'transparent',
        },
        '&.MuiAutocomplete-option[aria-selected="true"]': {
          backgroundColor: 'transparent',
        },
      }}
    >
      <UiCard
        sx={{
          backgroundColor: isHighlighted ? 'action.selected' : 'transparent',
          inlineSize: '100%',
          px: 0.8,
          py: 0.25,
        }}
      >
        <Box sx={{ minInlineSize: 0 }}>
          {parts.map((part) => (
            <Box
              component="span"
              key={`${part.text}-${part.highlight}`}
              sx={{ fontWeight: part.highlight ? 700 : 500 }}
            >
              {part.text}
            </Box>
          ))}
        </Box>
      </UiCard>
    </Box>
  );
}
