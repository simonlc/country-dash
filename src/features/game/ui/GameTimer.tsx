import { Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

interface GameTimerProps {
  isRunning: boolean;
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

export function GameTimer({ isRunning }: GameTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const intervalIdRef = useRef<number | null>(null);

  useEffect(() => {
    const stopInterval = () => {
      if (intervalIdRef.current !== null) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };

    const updateElapsed = () => {
      const startedAt = startedAtRef.current ?? performance.now();
      setElapsedMs(Math.max(0, Math.floor(performance.now() - startedAt)));
    };

    const startInterval = () => {
      if (intervalIdRef.current !== null || document.visibilityState === 'hidden') {
        return;
      }

      intervalIdRef.current = window.setInterval(updateElapsed, 50);
    };

    if (!isRunning) {
      stopInterval();
      startedAtRef.current = null;
      return stopInterval;
    }

    if (startedAtRef.current === null) {
      startedAtRef.current = performance.now();
    }

    updateElapsed();
    startInterval();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopInterval();
        return;
      }

      updateElapsed();
      startInterval();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopInterval();
    };
  }, [isRunning]);

  return (
    <Typography component="p" variant="body2">
      {formatElapsed(elapsedMs)}
    </Typography>
  );
}
