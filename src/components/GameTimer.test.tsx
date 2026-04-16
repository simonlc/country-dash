import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { GameTimer } from '@/components/GameTimer';

it('renders the formatted timer value', () => {
  render(<GameTimer elapsedMs={12_345} />);

  expect(screen.getByText('0:00:12')).toBeVisible();
});
