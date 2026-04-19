import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useI18n } from '@/app/i18n';
import { m } from '@/paraglide/messages.js';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent } from '@/components/ui/popover';
import {
  buildGuessChoices,
  filterGuessChoices,
  findExactGuessChoice,
  labelStartsWithInput,
} from './guessChoices';
import { GuessAutocompleteInput } from './GuessAutocompleteInput';
import type { GuessInputProps, HighlightPart } from './types';
import { MobileGuessKeyboard } from './MobileGuessKeyboard';

function getGuessPlaceholder(variant: 'country' | 'capital') {
  return variant === 'capital'
    ? m.game_guess_placeholder_capital()
    : m.game_guess_placeholder_country();
}

function getGuessAriaLabel(variant: 'country' | 'capital') {
  return variant === 'capital'
    ? m.game_guess_label_capital()
    : m.game_guess_label_country();
}

export function GuessInput({
  onSubmit,
  options,
  useVirtualKeyboard = false,
  variant,
}: GuessInputProps) {
  const inputId = useId();
  const { locale } = useI18n();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
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
  const completionChoice = useMemo(
    () =>
      filteredOptions.find((choice) =>
        labelStartsWithInput(choice, inputValue),
      ) ?? null,
    [filteredOptions, inputValue],
  );
  const guessAriaLabel = getGuessAriaLabel(variant);

  const submitGuess = useCallback(
    (rawValue?: string) => {
      const enteredValue = rawValue?.trim() ?? inputValue.trim();

      if (!enteredValue) {
        return;
      }

      const submittedValue =
        findExactGuessChoice(choices, enteredValue)?.label ?? enteredValue;
      setOpen(false);
      onSubmit(submittedValue);
    },
    [choices, inputValue, onSubmit],
  );

  const selectOption = useCallback(
    (label: string, submit: boolean) => {
      setInputValue(label);
      setOpen(false);
      setHighlightedIndex(-1);

      if (submit) {
        submitGuess(label);
      }
    },
    [submitGuess],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === ' ' || event.key === 'Spacebar') {
        return;
      }

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
        if (completionChoice) {
          selectOption(completionChoice.label, false);
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
    },
    [
      filteredOptions,
      highlightedIndex,
      open,
      completionChoice,
      selectOption,
      submitGuess,
    ],
  );

  useEffect(() => {
    if (useVirtualKeyboard) {
      inputRef.current?.blur();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [useVirtualKeyboard]);

  if (useVirtualKeyboard) {
    return (
      <form
        className="grid w-full gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitGuess();
        }}
      >
        <GuessAutocompleteInput
          aria-label={guessAriaLabel}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          completionValue=""
          id={inputId}
          inputMode="none"
          placeholder={getGuessPlaceholder(variant)}
          readOnly
          ref={inputRef}
          spellCheck={false}
          tabIndex={-1}
          value={inputValue}
          onFocus={(event) => {
            event.currentTarget.blur();
          }}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onTouchStart={(event) => {
            event.preventDefault();
          }}
          onValueChange={() => undefined}
        />
        <MobileGuessKeyboard
          value={inputValue}
          onChange={setInputValue}
          onSubmit={() => {
            submitGuess();
          }}
        />
      </form>
    );
  }

  return (
    <form
      className="grid w-full gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submitGuess();
      }}
    >
      <div className="grid gap-1">
        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen && inputValue.trim().length > 0);
          }}
        >
          <GuessAutocompleteInput
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
            aria-label={guessAriaLabel}
            completionValue={completionChoice?.label ?? ''}
            enterKeyHint="done"
            id={inputId}
            inputMode="search"
            placeholder={getGuessPlaceholder(variant)}
            role="combobox"
            spellCheck={false}
            value={inputValue}
            ref={inputRef}
            onValueChange={(nextValue) => {
              setInputValue(nextValue);
              setHighlightedIndex(-1);
              setOpen(nextValue.trim().length > 0);
            }}
            onFocus={() => {
              setOpen(inputValue.trim().length > 0);
            }}
            onKeyDown={onKeyDown}
          />
          <PopoverContent
            anchor={inputRef}
            align="start"
            className="max-h-64 p-0"
            initialFocus={false}
            side="bottom"
            sideOffset={6}
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
                        className={
                          isHighlighted
                            ? 'bg-[rgba(127,127,127,0.16)]'
                            : undefined
                        }
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
