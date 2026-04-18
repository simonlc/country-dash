import { HudInfo } from '@/components/ui/hud-info';
import {
  displayElapsedMsAtom,
  runningSinceAtom,
} from '@/game/state/game-derived-atoms';
import { formatElapsed } from '@/utils/gameLogic';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

export function GameTimer() {
  const [tickNow, setTickNow] = useState(() => Date.now());
  const elapsedMs = useAtomValue(displayElapsedMsAtom);
  const runningSince = useAtomValue(runningSinceAtom);

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
    <HudInfo className="items-center" value={formatElapsed(liveElapsedMs)} />
  );
}
