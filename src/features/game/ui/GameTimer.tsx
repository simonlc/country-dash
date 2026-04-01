import { Stack, Typography } from '@mui/material';
import { formatElapsed } from '@/features/game/logic/gameLogic';

interface GameTimerProps {
  elapsedMs: number;
}

export function GameTimer({ elapsedMs }: GameTimerProps) {
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
        {formatElapsed(elapsedMs)}
      </Typography>
    </Stack>
  );
}
