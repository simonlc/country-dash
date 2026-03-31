import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { GameTimer } from '@/features/game/ui/GameTimer';

it('renders the initial timer value', () => {
  render(<GameTimer isRunning={false} onTick={vi.fn()} />);

  expect(screen.getByText('0:00:00.000')).toBeVisible();
});
