import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface GuessAutocompleteInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  completionValue: string;
  onValueChange: (value: string) => void;
  value: string;
}

export const GuessAutocompleteInput = forwardRef<
  HTMLInputElement,
  GuessAutocompleteInputProps
>(({ completionValue, onValueChange, value, ...props }, ref) => {
  const hintSuffix =
    value &&
    completionValue.toLocaleLowerCase().startsWith(value.toLocaleLowerCase())
      ? completionValue.slice(value.length)
      : '';

  return (
    <div className="relative">
      <input
        {...props}
        className="flex h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-base font-semibold text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        ref={ref}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
      />
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
});

GuessAutocompleteInput.displayName = 'GuessAutocompleteInput';
