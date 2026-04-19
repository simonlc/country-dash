import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { MobileGuessKeyboard } from './MobileGuessKeyboard';

describe('MobileGuessKeyboard', () => {
  it('keeps themed special keys accessible', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    const { container } = renderWithProviders(
      <MobileGuessKeyboard onChange={onChange} onSubmit={onSubmit} value="" />,
    );

    expect(
      container.querySelector('.hg-theme-default.country-dash-mobile-keyboard'),
    ).toBeTruthy();
    expect(
      container.querySelector('.hg-button-backspace[aria-label="Backspace"]'),
    ).toHaveClass(
      'hg-button-backspace',
    );

    await user.click(screen.getByText('Enter'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
