import { Typography } from '@mui/material';
import { formatElapsed } from '@/features/game/logic/gameLogic';

interface GameTimerProps {
  elapsedMs: number;
}

export function GameTimer({ elapsedMs }: GameTimerProps) {
  return (
    <Typography component="p" variant="body2">
      {formatElapsed(elapsedMs)}
    </Typography>
  );
}
