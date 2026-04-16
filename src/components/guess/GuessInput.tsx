import { designTokens } from '@/app/designSystem';
import { useI18n } from '@/app/i18n';
import { m } from '@/paraglide/messages.js';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  useCallback,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { GuessAutocompleteInput } from './GuessAutocompleteInput';
import { GuessAutocompleteOption } from './GuessAutocompleteOption';
import {
  buildGuessChoices,
  filterGuessChoices,
  findExactGuessChoice,
  labelStartsWithInput,
} from './guessChoices';
import type { GuessChoice, GuessInputProps } from './types';

export function GuessInput({ onSubmit, options, variant }: GuessInputProps) {
  const theme = useTheme();
  const isMobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const { locale } = useI18n();
  const [highlightedChoice, setHighlightedChoice] =
    useState<GuessChoice | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [hintValue, setHintValue] = useState('');
  const [open, setOpen] = useState(false);
  const hintSuffix =
    inputValue && hintValue.startsWith(inputValue)
      ? hintValue.slice(inputValue.length)
      : '';
  const choices = useMemo(
    () => buildGuessChoices(options, variant, locale),
    [locale, options, variant],
  );

  const getFilteredOptions = useCallback(
    (nextValue: string) => filterGuessChoices(choices, nextValue),
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
    (nextValue: string) => findExactGuessChoice(choices, nextValue),
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
          ? filteredOptions.findIndex(
              (option) => option.id === highlightedChoice.id,
            )
          : -1;
        const nextIndex =
          event.key === 'ArrowDown'
            ? (currentIndex + 1 + filteredOptions.length) %
              filteredOptions.length
            : (currentIndex - 1 + filteredOptions.length) %
              filteredOptions.length;

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
        inlineSize: '100%',
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
                fontSize: {
                  md: designTokens.fontSize.sm,
                  xs: designTokens.fontSize.md,
                },
                minHeight: {
                  md: 30,
                  xs: 44,
                },
                py: {
                  md: 0.25,
                  xs: 1,
                },
              },
              maxHeight: {
                md: 280,
                xs: 'min(calc(var(--visual-viewport-height, 100dvh) * 0.36), 240px)',
              },
              overflowY: 'auto',
              overscrollBehavior: 'contain',
            },
          },
          popper: {
            modifiers: [
              {
                enabled: isMobileLayout,
                name: 'flip',
              },
            ],
            placement: isMobileLayout ? 'top-start' : 'bottom-start',
          },
        }}
        value={null}
        filterOptions={(allOptions, state) =>
          filterGuessChoices(allOptions, state.inputValue)
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
          <GuessAutocompleteInput
            hintSuffix={hintSuffix}
            inputValue={inputValue}
            params={params}
            variant={variant}
          />
        )}
        renderOption={(props, option, state) => {
          const { key, ...optionProps } = props;

          return (
            <GuessAutocompleteOption
              highlightedChoiceId={highlightedChoice?.id ?? null}
              inputValue={state.inputValue}
              key={key}
              option={option}
              optionProps={optionProps}
            />
          );
        }}
      />
    </Box>
  );
}
