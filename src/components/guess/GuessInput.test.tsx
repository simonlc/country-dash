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
      <GuessInput onSubmit={onSubmit} options={options} variant="country" />,
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'Denmark{enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('Denmark');
  });

  it('submits the highlighted option when navigating with arrows and pressing Enter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <GuessInput onSubmit={onSubmit} options={options} variant="country" />,
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'dom');
    const firstOption = screen.getAllByRole('option')[0];
    const firstLabel = firstOption?.textContent ?? '';
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(firstLabel);
  });

  it('does not auto-select an option while typing', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <GuessInput onSubmit={onSubmit} options={options} variant="country" />,
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'domin{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('domin');
  });

  it('accepts the first matching hint on Tab', () => {
    const onSubmit = vi.fn();

    renderWithProviders(
      <GuessInput onSubmit={onSubmit} options={options} variant="country" />,
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'dom' } });
    fireEvent.keyDown(input, { key: 'Tab' });

    expect(input).toHaveValue('Dominica');
  });

  it('shows the tab-completion hint text that Tab applies', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <GuessInput onSubmit={vi.fn()} options={options} variant="country" />,
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'dom');

    expect(screen.getByTestId('guess-tab-hint')).toHaveTextContent(/dominica/i);
    await user.keyboard('{Tab}');

    expect(input).toHaveValue('Dominica');
    expect(screen.queryByTestId('guess-tab-hint')).not.toBeInTheDocument();
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

    const input = screen.getByRole('combobox');
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

    const input = screen.getByRole('combobox');
    await user.type(input, 'cam');

    expect(input).toHaveValue('cam');
  });

  it('allows typing spaces without toggling the autocomplete popover', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <GuessInput onSubmit={vi.fn()} options={options} variant="country" />,
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'dom');

    await user.type(input, ' ');

    expect(input).toHaveValue('dom ');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
  });

  it('does not render the official country name in dropdown options', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <GuessInput
        onSubmit={vi.fn()}
        options={[
          {
            formalName: 'Commonwealth of Dominica',
            isocode: 'DM',
            isocode3: 'DMA',
            nameEn: 'Dominica',
          },
        ]}
        variant="country"
      />,
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'dom');

    expect(screen.getByRole('option', { name: /dominica/i })).toBeVisible();
    expect(
      screen.queryByText('Commonwealth of Dominica'),
    ).not.toBeInTheDocument();
  });

  it('shows no autocomplete options when nothing prefix-matches', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <GuessInput onSubmit={vi.fn()} options={options} variant="country" />,
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'xyz');

    expect(screen.getByText('No matches')).toBeVisible();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('limits autocomplete results to five options', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <GuessInput
        onSubmit={vi.fn()}
        options={[
          { isocode: 'DO', isocode3: 'DOM', nameEn: 'Dominican Republic' },
          { isocode: 'DM', isocode3: 'DMA', nameEn: 'Dominica' },
          { isocode: 'DK', isocode3: 'DNK', nameEn: 'Denmark' },
          { isocode: 'DJ', isocode3: 'DJI', nameEn: 'Djibouti' },
          {
            isocode: 'DZ',
            isocode3: 'DZA',
            nameEn: 'Algeria',
            nameAlt: 'Dzayer',
          },
        ]}
        variant="country"
      />,
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'd');

    expect(screen.getAllByRole('option')).toHaveLength(5);
    expect(screen.getByRole('option', { name: 'Algeria' })).toBeVisible();
  });

  it('uses a read-only textbox without autocomplete when the virtual keyboard is enabled', () => {
    renderWithProviders(
      <GuessInput
        onSubmit={vi.fn()}
        options={options}
        useVirtualKeyboard
        variant="country"
      />,
    );

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    expect(screen.getByTestId('guess-mobile-keyboard')).toBeVisible();
  });

  it('submits guesses from the in-app virtual keyboard', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <GuessInput
        onSubmit={onSubmit}
        options={options}
        useVirtualKeyboard
        variant="country"
      />,
    );

    for (const letter of ['d', 'e', 'n', 'm', 'a', 'r', 'k']) {
      await user.click(screen.getByText(new RegExp(`^${letter}$`, 'i')));
    }

    await user.click(screen.getByText(/^Enter$/i));

    expect(screen.getByRole('textbox')).toHaveValue('denmark');
    expect(onSubmit).toHaveBeenCalledWith('Denmark');
  });
});
