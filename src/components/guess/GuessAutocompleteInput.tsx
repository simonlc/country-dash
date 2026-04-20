import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface GuessAutocompleteInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  completionValue: string;
  fakeCaretPlaceholder?: string;
  onValueChange: (value: string) => void;
  showFakeCaret?: boolean;
  value: string;
}

export const GuessAutocompleteInput = forwardRef<
  HTMLInputElement,
  GuessAutocompleteInputProps
>(
  (
    {
      className,
      completionValue,
      fakeCaretPlaceholder,
      onValueChange,
      showFakeCaret = false,
      value,
      ...props
    },
    ref,
  ) => {
  const hintSuffix =
    value &&
    completionValue.toLocaleLowerCase().startsWith(value.toLocaleLowerCase())
      ? completionValue.slice(value.length)
      : '';

  return (
    <div className="relative">
      <input
        {...props}
        className={`flex h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-base font-semibold text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${showFakeCaret ? 'caret-transparent placeholder:text-transparent' : ''} ${className ?? ''}`}
        ref={ref}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
      />
      {showFakeCaret ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-3 py-2 text-base font-semibold text-[var(--color-foreground)]"
        >
          {value ? <span className="invisible whitespace-pre">{value}</span> : null}
          <span className="guess-input-fake-caret" data-testid="guess-fake-caret" />
          {!value && fakeCaretPlaceholder ? (
            <span className="text-[var(--color-muted)]">{fakeCaretPlaceholder}</span>
          ) : null}
        </div>
      ) : null}
      {hintSuffix ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-3 py-2 text-base font-semibold text-[var(--color-muted)]"
          data-testid="guess-tab-hint"
        >
          <span className="invisible">{value}</span>
          <span>{hintSuffix}</span>
        </div>
      ) : null}
    </div>
  );
},
);

GuessAutocompleteInput.displayName = 'GuessAutocompleteInput';
