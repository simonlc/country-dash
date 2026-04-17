import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { GuessPanel } from './GuessPanel';

describe('GuessPanel', () => {
  it('renders the prompt and guess input', () => {
    renderWithProviders(
      <GuessPanel
        countryOptions={[
          {
            isocode: 'CA',
            isocode3: 'CAN',
            nameEn: 'Canada',
          },
        ]}
        isCapitalMode={false}
        isKeyboardOpen={false}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(/guess the highlighted country/i)).toBeVisible();
    expect(screen.getByLabelText(/guess the country/i)).toBeVisible();
  });
});
