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
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { designTokens } from '@/app/designSystem';
import { normalizeGuess } from '@/utils/gameLogic';
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
  const hintRef = useRef('');
  const [value, setValue] = useState<GuessChoice | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const hintSuffix =
    inputValue && hintRef.current.startsWith(inputValue)
      ? hintRef.current.slice(inputValue.length)
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

  const getFilteredOptions = useCallback(
    (nextValue: string) => filterOptions(choices, nextValue),
    [choices],
  );

  const updateHint = useCallback(
    (nextValue: string) => {
      const matchingOption = getFilteredOptions(nextValue).find((option) =>
        labelStartsWithInput(option, nextValue),
      );

      hintRef.current =
        nextValue && matchingOption
          ? nextValue + matchingOption.label.slice(nextValue.length)
          : '';
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
      setValue(findExactMatch(nextValue));
      updateHint(nextValue);
      setOpen(nextValue.trim().length > 0);
    },
    [findExactMatch, updateHint],
  );

  const syncSelectedChoice = useCallback((nextValue: GuessChoice | null) => {
    setValue(nextValue);

    if (!nextValue) {
      hintRef.current = '';
      return;
    }

    setInputValue(nextValue.label);
    hintRef.current = nextValue.label;
    setOpen(false);
  }, []);

  const submitGuess = useCallback(
    (rawValue?: string) => {
      const submittedValue = value?.label ?? rawValue?.trim() ?? inputValue.trim();

      if (!submittedValue) {
        return;
      }

      setOpen(false);
      onSubmit(submittedValue);
    },
    [inputValue, onSubmit, value],
  );

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const field = event.currentTarget.querySelector('input');
      submitGuess(field?.value);
    },
    [submitGuess],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Tab' && hintRef.current) {
        const [matchingOption] = getFilteredOptions(inputValue);

        if (matchingOption) {
          syncSelectedChoice(matchingOption);
          event.preventDefault();
        }
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        submitGuess();
      }
    },
    [getFilteredOptions, inputValue, submitGuess, syncSelectedChoice],
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
        autoHighlight
        disablePortal
        forcePopupIcon={false}
        id="country-guess"
        inputValue={inputValue}
        noOptionsText="No matches"
        open={open}
        openOnFocus={false}
        options={choices}
        slotProps={{
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
          if (nextValue) {
            syncSelectedChoice(nextValue);
          }
        }}
        onClose={() => setOpen(false)}
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
            />
            <Typography
              aria-hidden
              sx={{
                alignItems: 'center',
                color: 'text.disabled',
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
              </Box>
            </Box>
          );
        }}
      />
    </Box>
  );
}
