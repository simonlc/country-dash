import { useEffect, useMemo, useState } from 'react';
import { m } from '@/paraglide/messages.js';
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
    return m.cipher_stage_route_synthesis();
  }
  if (progress < 0.52) {
    return m.cipher_stage_orbital_handoff();
  }
  if (progress < 0.82) {
    return m.cipher_stage_vector_scramble();
  }
  return m.cipher_stage_lock_reacquired();
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

function getCipherOpacityClass(opacity: number) {
  if (opacity <= 0.05) return 'opacity-0';
  if (opacity <= 0.1) return 'opacity-10';
  if (opacity <= 0.2) return 'opacity-20';
  if (opacity <= 0.3) return 'opacity-30';
  if (opacity <= 0.4) return 'opacity-40';
  if (opacity <= 0.5) return 'opacity-50';
  if (opacity <= 0.6) return 'opacity-60';
  if (opacity <= 0.7) return 'opacity-70';
  if (opacity <= 0.8) return 'opacity-80';
  if (opacity <= 0.9) return 'opacity-90';
  return 'opacity-100';
}

function getCipherProgressWidthClass(progress: number) {
  const width = Math.max(progress * 100, 8);
  if (width < 10) return 'w-[8%]';
  if (width < 20) return 'w-[18%]';
  if (width < 30) return 'w-[28%]';
  if (width < 40) return 'w-[38%]';
  if (width < 50) return 'w-[48%]';
  if (width < 60) return 'w-[58%]';
  if (width < 70) return 'w-[68%]';
  if (width < 80) return 'w-[78%]';
  if (width < 90) return 'w-[88%]';
  if (width < 100) return 'w-[98%]';
  return 'w-full';
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
  const transitionOpacityClass = getCipherOpacityClass(transitionOpacity);
  const progressWidthClass = getCipherProgressWidthClass(progress);
  const statusLines = [
    `${m.cipher_transition_handoff_label()} // ${stage}`,
    `${m.cipher_transition_rotation_label()} // ${m.cipher_transition_rotation_active()}`,
    `${m.cipher_transition_redaction_label()} // ${m.cipher_transition_country_masked()}`,
  ];

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-[1] flex items-end justify-center ${transitionOpacityClass}`}
    >
      <div
        className="cipher-transition-panel"
        key={transition.key}
      >
        <div className="mb-[max(12px,env(safe-area-inset-bottom))] w-[min(460px,calc(100vw-28px))]">
          <div className="flex items-center justify-between font-mono text-[clamp(0.6rem,1.25vw,0.72rem)] uppercase tracking-[0.16em] text-[rgba(248,255,182,0.96)]">
            <span>{m.cipher_transition_signal_relay()}</span>
            <span>{percentLabel}</span>
          </div>
          <div className="cipher-transition-progress-track">
            <div
              className={`cipher-transition-progress-bar ${progressWidthClass}`}
            />
          </div>
          <div className="mt-[0.6rem] grid gap-[0.38rem] font-mono text-[clamp(0.58rem,1.15vw,0.68rem)] uppercase tracking-[0.14em] text-[rgba(149,255,239,0.9)]">
            {statusLines.map((line) => (
              <div className="cipher-transition-line" key={line}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
