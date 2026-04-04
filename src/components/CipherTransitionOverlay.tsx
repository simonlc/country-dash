import { useEffect, useMemo, useState } from 'react';
import {
  cipherCountryTransitionDurationMs,
  type CipherCountryTransition,
} from '@/utils/globeCipherOverlays';

interface CipherTransitionOverlayProps {
  opacity?: number;
  transition: CipherCountryTransition | null;
}

function getCipherTransitionStage(progress: number) {
  if (progress < 0.22) {
    return 'Route synthesis';
  }
  if (progress < 0.52) {
    return 'Orbital handoff';
  }
  if (progress < 0.82) {
    return 'Vector scramble';
  }
  return 'Lock reacquired';
}

function getCipherTransitionOpacity(progress: number) {
  if (progress < 0.12) {
    return progress / 0.12;
  }
  if (progress > 0.9) {
    return Math.max(0, (1 - progress) / 0.1);
  }
  return 1;
}

export function CipherTransitionOverlay({
  opacity = 1,
  transition,
}: CipherTransitionOverlayProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!transition) {
      return;
    }

    const updateElapsed = () => {
      setElapsedMs(
        Math.max(0, performance.now() - transition.startedAtMs),
      );
    };

    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 70);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [transition]);

  const progress = transition
    ? Math.min(elapsedMs / cipherCountryTransitionDurationMs, 1)
    : 0;

  const stage = useMemo(
    () => getCipherTransitionStage(progress).toUpperCase(),
    [progress],
  );

  if (!transition || progress >= 1) {
    return null;
  }

  const percentLabel = `${Math.round(progress * 100)
    .toString()
    .padStart(3, '0')}%`;
  const transitionOpacity = getCipherTransitionOpacity(progress) * opacity;
  const statusLines = [
    `HANDOFF // ${stage}`,
    'ROTATION // ACTIVE',
    'REDACTION // COUNTRY MASKED',
  ];

  return (
    <div
      aria-hidden="true"
      style={{
        alignItems: 'flex-end',
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        opacity: transitionOpacity,
        pointerEvents: 'none',
        position: 'absolute',
        zIndex: 1,
      }}
    >
      <div
        className="cipher-transition-panel"
        key={transition.key}
        style={{
          marginBottom: 'max(12px, env(safe-area-inset-bottom))',
          width: 'min(460px, calc(100vw - 28px))',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            color: 'rgba(248, 255, 182, 0.96)',
            display: 'flex',
            fontFamily:
              '"IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
            fontSize: 'clamp(0.6rem, 1.25vw, 0.72rem)',
            justifyContent: 'space-between',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          <span>Signal relay</span>
          <span>{percentLabel}</span>
        </div>
        <div className="cipher-transition-progress-track">
          <div
            className="cipher-transition-progress-bar"
            style={{ width: `${Math.max(progress * 100, 8)}%` }}
          />
        </div>
        <div
          style={{
            color: 'rgba(149, 255, 239, 0.9)',
            display: 'grid',
            fontFamily:
              '"IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
            fontSize: 'clamp(0.58rem, 1.15vw, 0.68rem)',
            gap: '0.38rem',
            letterSpacing: '0.14em',
            marginTop: '0.6rem',
            textTransform: 'uppercase',
          }}
        >
          {statusLines.map((line) => (
            <div className="cipher-transition-line" key={line}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
