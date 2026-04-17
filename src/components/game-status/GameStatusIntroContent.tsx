import { Typography } from '@mui/material';
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
        <Typography variant="body1">{m.game_choose_run()}</Typography>
        <Typography color="text.secondary" variant="body2">
          {m.game_daily_complete_short({
            correct: storedDailyResult.correctCount,
            total: storedDailyResult.totalCount,
          })}
        </Typography>
      </>
    );
  }

  return (
    <>
      <Typography variant="body1">{m.game_choose_run()}</Typography>
      <Typography color="text.secondary" variant="body2">
        {m.game_open_menu_daily()}
      </Typography>
    </>
  );
}
