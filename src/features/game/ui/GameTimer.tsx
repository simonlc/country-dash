import { Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

interface GameTimerProps {
  isRunning: boolean;
  onTick: (elapsedMs: number) => void;
}

function formatElapsed(elapsedMs: number) {
  const hours = Math.floor(elapsedMs / 3_600_000);
  const minutes = Math.floor((elapsedMs % 3_600_000) / 60_000);
  const seconds = Math.floor((elapsedMs % 60_000) / 1_000);
  const milliseconds = elapsedMs % 1_000;

  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

export function GameTimer({ isRunning, onTick }: GameTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning) {
      startedAtRef.current = null;
      return;
    }

    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }

    const intervalId = window.setInterval(() => {
      const startedAt = startedAtRef.current ?? Date.now();
      const nextElapsedMs = Date.now() - startedAt;
      setElapsedMs(nextElapsedMs);
      onTick(nextElapsedMs);
    }, 50);

    return () => window.clearInterval(intervalId);
  }, [isRunning, onTick]);

  return (
    <Typography component="p" variant="body2">
      {formatElapsed(elapsedMs)}
    </Typography>
  );
}
