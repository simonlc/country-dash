import { act, screen } from '@testing-library/react';
import { useAtomValue } from 'jotai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { todayDateKeyAtom } from './game-atoms';

function TodayDateKeyProbe() {
  const todayDateKey = useAtomValue(todayDateKeyAtom);
  return <output>{todayDateKey}</output>;
}

describe('game state atoms', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('refreshes the current daily key after UTC midnight', () => {
    vi.setSystemTime(new Date('2026-03-31T23:59:58.000Z'));

    renderWithProviders(<TodayDateKeyProbe />);

    expect(screen.getByText('2026-03-31')).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(screen.getByText('2026-04-01')).toBeVisible();
  });
});
