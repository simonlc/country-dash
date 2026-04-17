import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { useCallback, useMemo, useState, type KeyboardEvent } from 'react';
import { useI18n } from '@/app/i18n';
import { m } from '@/paraglide/messages.js';
import {
  buildGuessChoices,
  filterGuessChoices,
  findExactGuessChoice,
  labelStartsWithInput,
} from './guessChoices';
import type { GuessInputProps, HighlightPart } from './types';

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

export function GuessInput({ onSubmit, options, variant }: GuessInputProps) {
  const { locale } = useI18n();
  const [inputValue, setInputValue] = useState('');
  const [hintValue, setHintValue] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const choices = useMemo(
    () => buildGuessChoices(options, variant, locale),
    [locale, options, variant],
  );
  const filteredOptions = useMemo(
    () => filterGuessChoices(choices, inputValue),
    [choices, inputValue],
  );
  const hintSuffix =
    inputValue && hintValue.startsWith(inputValue)
      ? hintValue.slice(inputValue.length)
      : '';

  const updateHint = useCallback((nextValue: string) => {
    const matchingOption = filterGuessChoices(choices, nextValue).find((option) =>
      labelStartsWithInput(option, nextValue),
    );

    setHintValue(
      nextValue && matchingOption
        ? nextValue + matchingOption.label.slice(nextValue.length)
        : '',
    );
  }, [choices]);

  const submitGuess = useCallback((rawValue?: string) => {
    const enteredValue = rawValue?.trim() ?? inputValue.trim();

    if (!enteredValue) {
      return;
    }

    const submittedValue = findExactGuessChoice(choices, enteredValue)?.label ?? enteredValue;
    setOpen(false);
    onSubmit(submittedValue);
  }, [choices, inputValue, onSubmit]);

  const selectOption = useCallback((label: string, submit: boolean) => {
    setInputValue(label);
    setHintValue(label);
    setOpen(false);
    setHighlightedIndex(-1);

    if (submit) {
      submitGuess(label);
    }
  }, [submitGuess]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && open) {
      if (filteredOptions.length === 0) {
        return;
      }

      event.preventDefault();
      const nextIndex =
        event.key === 'ArrowDown'
          ? (highlightedIndex + 1 + filteredOptions.length) %
            filteredOptions.length
          : (highlightedIndex - 1 + filteredOptions.length) %
            filteredOptions.length;
      setHighlightedIndex(nextIndex);
      return;
    }

    if (event.key === 'Tab' && hintValue) {
      const firstMatchingOption = filterGuessChoices(choices, inputValue)[0];
      if (firstMatchingOption) {
        selectOption(firstMatchingOption.label, false);
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      if (open && highlightedIndex >= 0) {
        const highlightedOption = filteredOptions[highlightedIndex];
        if (highlightedOption) {
          submitGuess(highlightedOption.label);
          return;
        }
      }

      submitGuess();
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      setHighlightedIndex(-1);
    }
  }, [
    choices,
    filteredOptions,
    highlightedIndex,
    hintValue,
    inputValue,
    open,
    selectOption,
    submitGuess,
  ]);

  const guessLabel = getGuessLabel(variant);

  return (
    <form
      className="grid w-full gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submitGuess();
      }}
    >
      <div className="relative">
        <label
          className="mb-1 block text-sm font-semibold"
          htmlFor="country-guess"
        >
          {guessLabel}
        </label>
        <input
          aria-autocomplete="list"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-3 text-base font-semibold"
          enterKeyHint="done"
          id="country-guess"
          inputMode="search"
          placeholder={getGuessPlaceholder(variant)}
          spellCheck={false}
          value={inputValue}
          onBlur={() => {
            setHintValue('');
            window.setTimeout(() => {
              setOpen(false);
              setHighlightedIndex(-1);
            }, 80);
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            setInputValue(nextValue);
            setHighlightedIndex(-1);
            setOpen(nextValue.trim().length > 0);
            updateHint(nextValue);
          }}
          onFocus={() => {
            setOpen(inputValue.trim().length > 0);
          }}
          onKeyDown={onKeyDown}
        />
        {hintSuffix ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 top-[26px] flex items-center overflow-hidden px-3 py-3 text-base font-semibold text-[var(--color-muted)]"
          >
            <span className="invisible">{inputValue}</span>
            <span>{hintSuffix}</span>
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="max-h-64 overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-2">
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-1 text-sm text-[var(--color-muted)]">
              {m.game_no_matches()}
            </div>
          ) : (
            <ul role="listbox">
              {filteredOptions.map((option, index) => {
                const parts = parse(
                  option.label,
                  match(option.label, inputValue, { insideWords: true }),
                ) as HighlightPart[];
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    aria-selected={isHighlighted}
                    className="mb-1 last:mb-0"
                    key={option.id}
                    role="option"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectOption(option.label, true);
                    }}
                    onMouseEnter={() => {
                      setHighlightedIndex(index);
                    }}
                  >
                    <div
                      className={`w-full rounded-sm px-2 py-1 ${
                        isHighlighted ? 'bg-[rgba(127,127,127,0.16)]' : 'bg-transparent'
                      }`}
                    >
                      {parts.map((part) => (
                        <span
                          className={part.highlight ? 'font-bold' : 'font-medium'}
                          key={`${part.text}-${part.highlight}`}
                        >
                          {part.text}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </form>
  );
}
