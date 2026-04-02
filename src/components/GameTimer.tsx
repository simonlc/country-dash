import { Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
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
    }, 50);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [runningSince]);

  const liveElapsedMs =
    runningSince === null
      ? elapsedMs
      : elapsedMs + Math.max(0, Math.floor(tickNow - runningSince));

  return (
    <Stack spacing={0.2} sx={{ minWidth: 88 }}>
      <Typography color="text.secondary" variant="caption">
        Time
      </Typography>
      <Typography
        component="p"
        sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
        variant="h6"
      >
        {formatElapsed(liveElapsedMs)}
      </Typography>
    </Stack>
  );
}
