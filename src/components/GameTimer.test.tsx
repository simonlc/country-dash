import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { GameTimer } from '@/components/GameTimer';
import { renderWithProviders } from '@/test/render';

it('renders the formatted timer value', () => {
  renderWithProviders(<GameTimer />);

  expect(screen.getByText('0:00:00')).toBeVisible();
});
