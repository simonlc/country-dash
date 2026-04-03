import { cleanup, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { GuessInput } from './GuessInput';

const options = [
  {
    nameEn: 'Dominican Republic',
    isocode: 'DO',
    isocode3: 'DOM',
  },
  {
    nameEn: 'Dominica',
    isocode: 'DM',
    isocode3: 'DMA',
  },
  {
    nameEn: 'Denmark',
    isocode: 'DK',
    isocode3: 'DNK',
  },
];

describe('GuessInput', () => {
  beforeEach(() => {
    cleanup();
  });

  it('submits once when Enter is pressed', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <GuessInput
        onSubmit={onSubmit}
        options={options}
        variant="country"
      />,
    );

    const input = screen.getByLabelText(/guess the country/i);
    await user.type(input, 'Denmark{enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('Denmark');
  });

  it('accepts the first matching hint on Tab', async () => {
    const onSubmit = vi.fn();

    renderWithProviders(
      <GuessInput
        onSubmit={onSubmit}
        options={options}
        variant="country"
      />,
    );

    const input = screen.getByLabelText(/guess the country/i);
    fireEvent.change(input, { target: { value: 'dom' } });
    fireEvent.keyDown(input, { key: 'Tab' });

    expect(input).toHaveValue('Dominica');
  });

  it('uses capital options in capital mode', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <GuessInput
        onSubmit={vi.fn()}
        options={[
          {
            capitalAliases: ['Ottawa'],
            capitalName: 'Ottawa',
            isocode: 'CA',
            isocode3: 'CAN',
            nameEn: 'Canada',
          },
          {
            capitalAliases: ['Tokyo'],
            capitalName: 'Tokyo',
            isocode: 'JP',
            isocode3: 'JPN',
            nameEn: 'Japan',
          },
        ]}
        variant="capital"
      />,
    );

    const input = screen.getByLabelText(/guess the capital city/i);
    await user.type(input, 'Ott');
    await user.tab();

    expect(input).toHaveValue('Ottawa');
  });

  it('keeps typed text stable while entering a guess character by character', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <GuessInput
        onSubmit={vi.fn()}
        options={[
          {
            isocode: 'CA',
            isocode3: 'CAN',
            nameEn: 'Canada',
          },
          {
            isocode: 'CM',
            isocode3: 'CMR',
            nameEn: 'Cameroon',
          },
        ]}
        variant="country"
      />,
    );

    const input = screen.getByLabelText(/guess the country/i);
    await user.type(input, 'cam');

    expect(input).toHaveValue('cam');
  });
});
