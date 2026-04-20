import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { GuessPanel } from './GuessPanel';

describe('GuessPanel', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the prompt and guess input', () => {
    renderWithProviders(<GuessPanel />);

    expect(screen.getByText(/guess the highlighted country/i)).toBeVisible();
    expect(screen.getByRole('combobox')).toBeVisible();
  });

  it('uses the virtual keyboard on coarse-pointer mobile layouts', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches:
          query.includes('max-width: 767.95px') || query.includes('pointer: coarse'),
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    );

    renderWithProviders(<GuessPanel />);

    expect(screen.getByTestId('guess-mobile-keyboard')).toBeVisible();
    expect(screen.queryByText(/guess the highlighted country/i)).not.toBeInTheDocument();
  });
});
