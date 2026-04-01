import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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
  it('uses the same first match for Tab selection and the dropdown list', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(<GuessInput onSubmit={onSubmit} options={options} />);

    const input = screen.getByLabelText(/guess the country/i);
    await user.type(input, 'dom');

    const listbox = await screen.findByRole('listbox');
    const firstOption = within(listbox).getAllByRole('option').at(0);

    expect(firstOption).toBeDefined();

    const firstOptionText = firstOption?.textContent;

    expect(firstOptionText).toBeTruthy();

    await user.tab();

    expect(input).toHaveValue(firstOptionText ?? '');
  });
});
