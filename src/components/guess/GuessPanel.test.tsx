import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appThemes, getThemeSurfaceStyles } from '@/app/theme';
import { renderWithProviders } from '@/test/render';
import { GuessPanel } from './GuessPanel';

const activeTheme = appThemes[0]!;
const panelSurface = getThemeSurfaceStyles(activeTheme, 'panel');

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
        panelSurface={panelSurface}
      />,
    );

    expect(screen.getByText(/guess the highlighted country/i)).toBeVisible();
    expect(screen.getByLabelText(/guess the country/i)).toBeVisible();
  });
});
