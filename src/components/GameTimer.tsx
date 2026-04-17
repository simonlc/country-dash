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
  const [tickNow, setTickNow] = useState(() => Date.now());

  useEffect(() => {
    if (runningSince === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTickNow(Date.now());
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
    <div className="grid w-full min-w-0 gap-[2px]">
      <p className="text-xs font-medium text-[var(--color-foreground)]">
        {m.game_stat_time()}
      </p>
      <p className="m-0 whitespace-nowrap text-[1rem] font-semibold leading-[1.1] tabular-nums md:text-[1.1rem]">
        {formatElapsed(liveElapsedMs)}
      </p>
    </div>
  );
}
