import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { matchSorter } from 'match-sorter';
import { useMemo, useRef, useState } from 'react';
import { designTokens } from '@/app/designSystem';
import { normalizeGuess } from '@/features/game/logic/gameLogic';
import type { CountryProperties } from '@/features/game/types';

interface HighlightPart {
  highlight: boolean;
  text: string;
}

interface GuessInputProps {
  options: CountryProperties[];
  variant: 'country' | 'capital';
  onSubmit: (term: string) => void;
}

interface GuessChoice {
  aliases: string[];
  detail: string | null;
  id: string;
  label: string;
}

const filterOptions = (options: GuessChoice[], inputValue: string) =>
  matchSorter(options, inputValue, {
    keys: [
      (item) =>
        `${item.label}, ${item.aliases.join(', ')}, ${item.detail ?? ''}`,
    ],
  }).slice(0, 5);

export function GuessInput({ options, variant, onSubmit }: GuessInputProps) {
  const hintRef = useRef('');
  const [value, setValue] = useState<GuessChoice | undefined>(undefined);
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const choices = useMemo<GuessChoice[]>(
    () =>
      variant === 'capital'
        ? options
            .filter((option): option is CountryProperties & { capitalName: string } =>
              Boolean(option.capitalName),
            )
            .map((option) => ({
              aliases: option.capitalAliases ?? [option.capitalName],
              detail: null,
              id: `${option.isocode3}-${option.capitalName}`,
              label: option.capitalName,
            }))
        : options.map((option) => ({
            aliases: [
              option.nameEn,
              option.name ?? '',
              option.abbr ?? '',
              option.nameAlt ?? '',
              option.formalName ?? '',
              option.isocode,
              option.isocode3,
            ].filter((alias): alias is string => Boolean(alias)),
            detail:
              option.formalName && option.formalName !== option.nameEn
                ? option.formalName
                : null,
            id:
              option.isocode3 === '-99'
                ? `${option.nameEn}-${option.isocode}`
                : option.isocode3,
            label: option.nameEn,
          })),
    [options, variant],
  );

  function getFilteredOptions(nextValue: string) {
    return filterOptions(choices, nextValue);
  }

  function updateHint(nextValue: string) {
    const [matchingOption] = getFilteredOptions(nextValue);

    hintRef.current =
      nextValue && matchingOption
        ? nextValue + matchingOption.label.slice(nextValue.length)
        : '';
  }

  return (
    <Box
      component="form"
      onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const field = event.currentTarget.querySelector('input');
        const submittedValue =
          value?.label ?? field?.value.trim() ?? inputValue.trim();

        if (submittedValue) {
          onSubmit(submittedValue);
        }
      }}
      sx={{
        display: 'grid',
        gap: 1,
        maxWidth: 520,
        width: '100%',
      }}
    >
      <Autocomplete<GuessChoice, false, true, false>
        autoHighlight
        disableClearable
        disablePortal
        forcePopupIcon={false}
        id="country-guess"
        inputValue={inputValue}
        noOptionsText="No matches"
        open={open}
        openOnFocus={false}
        options={choices}
        value={value}
        filterOptions={(allOptions, state) =>
          filterOptions(allOptions, state.inputValue)
        }
        getOptionKey={(choice) => choice.id}
        getOptionLabel={(choice) => choice.label}
        onBlur={() => {
          hintRef.current = '';
        }}
        onChange={(_event, nextValue) => {
          setValue(nextValue);
          if (nextValue) {
            setInputValue(nextValue.label);
          }
          if (nextValue) {
            hintRef.current = nextValue.label;
          }
        }}
        onClose={() => setOpen(false)}
        onInputChange={(_event, nextInputValue) => {
          setInputValue(nextInputValue);
          const exactMatch =
            choices.find(
              (option) =>
                option.aliases.some(
                  (alias) =>
                    normalizeGuess(alias) === normalizeGuess(nextInputValue),
                ),
            ) ?? undefined;
          setValue(exactMatch);
          updateHint(nextInputValue);
          setOpen(nextInputValue.trim().length > 0);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Tab' && hintRef.current) {
            const [matchingOption] = getFilteredOptions(inputValue);

            if (matchingOption) {
              setInputValue(matchingOption.label);
              setValue(matchingOption);
              hintRef.current = matchingOption.label;
              setOpen(false);
              event.preventDefault();
            }
          }
          if (event.key === 'Enter') {
            const submittedValue = value?.label ?? inputValue.trim();

            if (submittedValue) {
              onSubmit(submittedValue);
              event.preventDefault();
            }
          }
        }}
        renderInput={(params) => (
          <Box sx={{ position: 'relative' }}>
            <TextField
              {...params}
              autoFocus
              label={
                variant === 'capital'
                  ? 'Guess the capital city'
                  : 'Guess the country'
              }
              placeholder={
                variant === 'capital'
                  ? 'Ottawa, Tokyo, Brasilia...'
                  : 'France, Japan, Brazil...'
              }
              sx={{
                '& .MuiInputLabel-root': {
                  fontWeight: designTokens.fontWeight.semibold,
                },
                '& .MuiInputBase-input': {
                  fontSize: designTokens.fontSize.md,
                  fontWeight: designTokens.fontWeight.semibold,
                  py: 1.5,
                },
              }}
              onChange={(event) => {
                const nextValue = event.target.value;
                setInputValue(nextValue);
                updateHint(nextValue);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  const submittedValue = value?.label ?? inputValue.trim();

                  if (submittedValue) {
                    onSubmit(submittedValue);
                    event.preventDefault();
                  }
                }
              }}
            />
            <Typography
              sx={{
                color: 'text.disabled',
                fontSize: designTokens.fontSize.md,
                fontWeight: designTokens.fontWeight.semibold,
                left: 16,
                overflow: 'hidden',
                pointerEvents: 'none',
                position: 'absolute',
                right: 16,
                top: 19,
                whiteSpace: 'nowrap',
              }}
            >
              {hintRef.current}
            </Typography>
          </Box>
        )}
        renderOption={(props, option, state) => {
          const { key, ...optionProps } = props;
          const matches = match(option.label, state.inputValue, {
            insideWords: true,
          });
          const parts = parse(option.label, matches) as HighlightPart[];

          return (
            <Box
              key={key}
              component="li"
              {...optionProps}
              sx={{ alignItems: 'center' }}
            >
              <Box sx={{ minWidth: 0 }}>
                {parts.map((part) => (
                  <Box
                    component="span"
                    key={`${part.text}-${part.highlight}`}
                    sx={{ fontWeight: part.highlight ? 700 : 500 }}
                  >
                    {part.text}
                  </Box>
                ))}
                {option.detail ? (
                  <Typography color="text.secondary" variant="caption">
                    {option.detail}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          );
        }}
      />
    </Box>
  );
}
