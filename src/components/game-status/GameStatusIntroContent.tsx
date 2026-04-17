import { m } from '@/paraglide/messages.js';

interface GameStatusIntroContentProps {
  storedDailyResult: {
    correctCount: number;
    totalCount: number;
  } | null;
}

export function GameStatusIntroContent({
  storedDailyResult,
}: GameStatusIntroContentProps) {
  if (storedDailyResult) {
    return (
      <>
        <p className="text-base">{m.game_choose_run()}</p>
        <p className="text-sm text-[var(--color-muted)]">
          {m.game_daily_complete_short({
            correct: storedDailyResult.correctCount,
            total: storedDailyResult.totalCount,
          })}
        </p>
      </>
    );
  }

  return (
    <>
      <p className="text-base">{m.game_choose_run()}</p>
      <p className="text-sm text-[var(--color-muted)]">
        {m.game_open_menu_daily()}
      </p>
    </>
  );
}
