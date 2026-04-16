import { Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { m } from '@/paraglide/messages.js';
import { formatElapsed } from '@/utils/gameLogic';

interface GameTimerProps {
  elapsedMs: number;
  runningSince?: number | null;
}

export function GameTimer({
  elapsedMs,
  runningSince = null,
}: GameTimerProps) {
  const [tickNow, setTickNow] = useState(() => performance.now());

  useEffect(() => {
    if (runningSince === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTickNow(performance.now());
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [runningSince]);

  const liveElapsedMs =
    runningSince === null
      ? elapsedMs
      : elapsedMs + Math.max(0, Math.floor(tickNow - runningSince));

  return (
    <Stack spacing={0.2} sx={{ inlineSize: '100%', minInlineSize: 0 }}>
      <Typography color="text.primary" variant="caption">
        {m.game_stat_time()}
      </Typography>
      <Typography
        component="p"
        sx={{
          fontVariantNumeric: 'tabular-nums',
          fontSize: { sm: '1.1rem', xs: '1rem' },
          whiteSpace: 'nowrap',
        }}
        variant="subtitle1"
      >
        {formatElapsed(liveElapsedMs)}
      </Typography>
    </Stack>
  );
}
