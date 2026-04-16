import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { matchSorter } from 'match-sorter';
import {
  useCallback,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useI18n } from '@/app/i18n';
import { designTokens } from '@/app/designSystem';
import { m } from '@/paraglide/messages.js';
import { normalizeGuess } from '@/utils/gameLogic';
import {
  getCountryDisplayName,
  getCountryNameCandidates,
} from '@/utils/countryNames';
import type { CountryProperties } from '@/types/game';

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

const MAX_VISIBLE_RESULTS = 4;

const normalizeText = (value: string) => normalizeGuess(value);

const matchesPrefix = (choice: GuessChoice, inputValue: string) => {
  const normalizedInput = normalizeText(inputValue);

  if (!normalizedInput) {
    return false;
  }

  return choice.aliases.some((alias) =>
    normalizeText(alias).startsWith(normalizedInput),
  );
};

const labelStartsWithInput = (choice: GuessChoice, inputValue: string) =>
  normalizeText(choice.label).startsWith(normalizeText(inputValue));

const filterOptions = (options: GuessChoice[], inputValue: string) => {
  const matchedOptions = options.filter((option) =>
    matchesPrefix(option, inputValue),
  );

  return matchSorter(matchedOptions, inputValue, {
    keys: [(item) => `${item.label}, ${item.aliases.join(', ')}`],
  }).slice(0, MAX_VISIBLE_RESULTS);
};

export function GuessInput({ options, variant, onSubmit }: GuessInputProps) {
  const { locale } = useI18n();
  const [highlightedChoice, setHighlightedChoice] = useState<GuessChoice | null>(
    null,
  );
  const [inputValue, setInputValue] = useState('');
  const [hintValue, setHintValue] = useState('');
  const [open, setOpen] = useState(false);
  const hintSuffix =
    inputValue && hintValue.startsWith(inputValue)
      ? hintValue.slice(inputValue.length)
      : '';
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
            aliases: getCountryNameCandidates(option),
            detail:
              option.formalName &&
              option.formalName !== getCountryDisplayName(option, locale)
                ? option.formalName
                : null,
            id:
              option.isocode3 === '-99'
                ? `${getCountryDisplayName(option, locale)}-${option.isocode}`
                : option.isocode3,
            label: getCountryDisplayName(option, locale),
          })),
    [locale, options, variant],
  );

  const getFilteredOptions = useCallback(
    (nextValue: string) => filterOptions(choices, nextValue),
    [choices],
  );

  const updateHint = useCallback(
    (nextValue: string) => {
      const matchingOption = getFilteredOptions(nextValue).find((option) =>
        labelStartsWithInput(option, nextValue),
      );

      setHintValue(
        nextValue && matchingOption
          ? nextValue + matchingOption.label.slice(nextValue.length)
          : '',
      );
    },
    [getFilteredOptions],
  );

  const findExactMatch = useCallback(
    (nextValue: string) =>
      choices.find((option) =>
        option.aliases.some(
          (alias) => normalizeGuess(alias) === normalizeGuess(nextValue),
        ),
      ) ?? null,
    [choices],
  );

  const syncInputState = useCallback(
    (nextValue: string) => {
      setInputValue(nextValue);
      setHighlightedChoice(null);
      updateHint(nextValue);
      setOpen(nextValue.trim().length > 0);
    },
    [updateHint],
  );

  const syncSelectedChoice = useCallback((nextValue: GuessChoice | null) => {
    setHighlightedChoice(nextValue);

    if (!nextValue) {
      setHintValue('');
      return;
    }

    setInputValue(nextValue.label);
    setHintValue(nextValue.label);
    setOpen(false);
  }, []);

  const submitGuess = useCallback(
    (rawValue?: string) => {
      const enteredValue = rawValue?.trim() ?? inputValue.trim();

      if (!enteredValue) {
        return;
      }

      const submittedValue = findExactMatch(enteredValue)?.label ?? enteredValue;
      setOpen(false);
      onSubmit(submittedValue);
    },
    [findExactMatch, inputValue, onSubmit],
  );

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submitGuess();
    },
    [submitGuess],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (!open) {
          return;
        }

        const filteredOptions = getFilteredOptions(inputValue);
        if (filteredOptions.length === 0) {
          return;
        }

        const currentIndex = highlightedChoice
          ? filteredOptions.findIndex((option) => option.id === highlightedChoice.id)
          : -1;
        const nextIndex =
          event.key === 'ArrowDown'
            ? (currentIndex + 1 + filteredOptions.length) % filteredOptions.length
            : (currentIndex - 1 + filteredOptions.length) % filteredOptions.length;

        setHighlightedChoice(filteredOptions[nextIndex] ?? null);
        event.preventDefault();
        return;
      }

      if (event.key === 'Tab' && hintValue) {
        const [matchingOption] = getFilteredOptions(inputValue);

        if (matchingOption) {
          syncSelectedChoice(matchingOption);
          event.preventDefault();
        }
      }

      if (event.key === 'Enter') {
        event.preventDefault();

        if (open && highlightedChoice) {
          syncSelectedChoice(highlightedChoice);
          submitGuess(highlightedChoice.label);
          return;
        }

        submitGuess();
      }
    },
    [
      getFilteredOptions,
      highlightedChoice,
      hintValue,
      inputValue,
      open,
      submitGuess,
      syncSelectedChoice,
    ],
  );

  return (
    <Box
      component="form"
      onSubmit={handleFormSubmit}
      sx={{
        display: 'grid',
        gap: 1,
        maxWidth: 520,
        width: '100%',
      }}
    >
      <Autocomplete<GuessChoice, false, false, false>
        disablePortal
        forcePopupIcon={false}
        id="country-guess"
        includeInputInList
        inputValue={inputValue}
        noOptionsText={m.game_no_matches()}
        open={open}
        openOnFocus={false}
        options={choices}
        slotProps={{
          listbox: {
            sx: {
              '& .MuiAutocomplete-option': {
                minHeight: 44,
              },
              maxHeight: {
                md: 280,
                xs: '42vh',
              },
            },
          },
          popper: {
            modifiers: [
              {
                enabled: false,
                name: 'flip',
              },
            ],
            placement: 'bottom-start',
          },
        }}
        value={null}
        filterOptions={(allOptions, state) =>
          filterOptions(allOptions, state.inputValue)
        }
        getOptionKey={(choice) => choice.id}
        getOptionLabel={(choice) => choice.label}
        onBlur={() => {
          setHintValue('');
        }}
        onChange={(_event, nextValue) => {
          if (nextValue) {
            syncSelectedChoice(nextValue);
          }
        }}
        onClose={() => {
          setOpen(false);
          setHighlightedChoice(null);
        }}
        onHighlightChange={(_event, nextValue, reason) => {
          if (reason === 'mouse' || reason === 'touch') {
            setHighlightedChoice(nextValue);
          }
        }}
        onInputChange={(_event, nextInputValue, reason) => {
          if (reason === 'input' || reason === 'clear') {
            syncInputState(nextInputValue);
          }
        }}
        onKeyDown={handleKeyDown}
        renderInput={(params) => (
          <Box sx={{ position: 'relative' }}>
            <TextField
              {...params}
              autoFocus
              label={
                variant === 'capital'
                  ? m.game_guess_label_capital()
                  : m.game_guess_label_country()
              }
              placeholder={
                variant === 'capital'
                  ? m.game_guess_placeholder_capital()
                  : m.game_guess_placeholder_country()
              }
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
              sx={{
                '&.MuiAutocomplete-option': {
                  backgroundColor:
                    highlightedChoice?.id === option.id ? 'action.selected' : 'transparent',
                },
                '&.MuiAutocomplete-option.Mui-focused': {
                  backgroundColor:
                    highlightedChoice?.id === option.id ? 'action.selected' : 'transparent',
                },
                '&.MuiAutocomplete-option[aria-selected="true"]': {
                  backgroundColor:
                    highlightedChoice?.id === option.id ? 'action.selected' : 'transparent',
                },
                alignItems: 'center',
              }}
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
              </Box>
            </Box>
          );
        }}
      />
    </Box>
  );
}
