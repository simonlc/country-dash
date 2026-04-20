import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { GuessPanel } from './GuessPanel';

describe('GuessPanel', () => {
  it('renders the prompt and guess input', () => {
    renderWithProviders(<GuessPanel />);

    expect(screen.getByText(/guess the highlighted country/i)).toBeVisible();
    expect(screen.getByRole('combobox')).toBeVisible();
  });

  it('keeps the native input path on mobile layouts', () => {
    renderWithProviders(<GuessPanel />);

    expect(screen.queryByTestId('guess-mobile-keyboard')).not.toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).not.toHaveLength(0);
  });
});
