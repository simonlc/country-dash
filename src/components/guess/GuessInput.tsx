import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { useCallback, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { useI18n } from '@/app/i18n';
import { m } from '@/paraglide/messages.js';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import {
  buildGuessChoices,
  filterGuessChoices,
  findExactGuessChoice,
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
  const listboxId = useId();
  const [inputValue, setInputValue] = useState('');
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

    if (event.key === 'Tab' && open) {
      const firstMatchingOption = filteredOptions[0];
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
    filteredOptions,
    highlightedIndex,
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
      <div className="grid gap-1">
        <label
          className="mb-1 block text-sm font-semibold"
          htmlFor="country-guess"
        >
          {guessLabel}
        </label>
        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen && inputValue.trim().length > 0);
          }}
        >
          <PopoverAnchor asChild>
            <input
              aria-activedescendant={
                open && highlightedIndex >= 0 && filteredOptions[highlightedIndex]
                  ? `${listboxId}-${filteredOptions[highlightedIndex]?.id}`
                  : undefined
              }
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-expanded={open}
              aria-haspopup="listbox"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              className="flex h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-base font-semibold text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              enterKeyHint="done"
              id="country-guess"
              inputMode="search"
              placeholder={getGuessPlaceholder(variant)}
              role="combobox"
              spellCheck={false}
              value={inputValue}
              onBlur={() => {
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
              }}
              onFocus={() => {
                setOpen(inputValue.trim().length > 0);
              }}
              onKeyDown={onKeyDown}
            />
          </PopoverAnchor>
          <PopoverContent
            align="start"
            className="max-h-64 p-0"
            sideOffset={6}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
            }}
          >
            <Command shouldFilter={false}>
              <CommandList id={listboxId} role="listbox">
                <CommandEmpty>{m.game_no_matches()}</CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option, index) => {
                    const parts = parse(
                      option.label,
                      match(option.label, inputValue, { insideWords: true }),
                    ) as HighlightPart[];
                    const isHighlighted = index === highlightedIndex;

                    return (
                      <CommandItem
                        id={`${listboxId}-${option.id}`}
                        aria-selected={isHighlighted}
                        className={isHighlighted ? 'bg-[rgba(127,127,127,0.16)]' : undefined}
                        key={option.id}
                        role="option"
                        value={option.label}
                        onMouseDown={(event) => {
                          event.preventDefault();
                        }}
                        onMouseEnter={() => {
                          setHighlightedIndex(index);
                        }}
                        onSelect={() => {
                          selectOption(option.label, true);
                        }}
                      >
                        {parts.map((part) => (
                          <span
                            className={`${part.highlight ? 'font-bold' : 'font-medium'} break-words`}
                            key={`${part.text}-${part.highlight}`}
                          >
                            {part.text}
                          </span>
                        ))}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

    </form>
  );
}
