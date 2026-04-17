import type { ReactNode } from 'react';
import { m } from '@/paraglide/messages.js';
import { GameTimer } from '@/components/GameTimer';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/components/ui/theme-provider';

interface GameHudProps {
  correct: number;
  displayElapsedMs: number;
  incorrect: number;
  isKeyboardOpen: boolean;
  livesRemaining: number | null;
  onRefocus: () => void;
  roundLabel: string;
  runningSince: number | null;
  score: number;
  sessionLabels: string[];
  sessionModeLabel: string;
  sessionSummaryLabel: string;
  showRefocus: boolean;
  streak: number;
  topBarMenu: ReactNode;
}

export function GameHud({
  correct,
  displayElapsedMs,
  incorrect,
  isKeyboardOpen,
  livesRemaining,
  onRefocus,
  roundLabel,
  runningSince,
  score,
  sessionLabels,
  sessionModeLabel,
  sessionSummaryLabel,
  showRefocus,
  streak,
  topBarMenu,
}: GameHudProps) {
  const isCompactLayout = useMediaQuery('(max-width: 599.95px)');
  const isKeyboardCompact = isCompactLayout && isKeyboardOpen;
  const isDenseHud = isCompactLayout || isKeyboardCompact;
  const statItems = isCompactLayout
    ? [
        { label: m.game_stat_score(), value: score },
        { label: m.game_stat_streak(), value: streak },
        ...(livesRemaining !== null
          ? [{ label: m.game_stat_lives(), value: livesRemaining }]
          : []),
      ]
    : [
        { label: m.game_stat_score(), value: score },
        { label: m.game_stat_streak(), value: streak },
        { label: m.game_stat_hit(), value: correct },
        { label: m.game_stat_miss(), value: incorrect },
        ...(livesRemaining !== null
          ? [{ label: m.game_stat_lives(), value: livesRemaining }]
          : []),
      ];

  return (
    <section
      className={`surface-elevated w-full rounded-t-none pt-[max(10px,calc(env(safe-area-inset-top)+10px))] md:rounded-md md:pt-2 ${
        isDenseHud ? 'px-2 py-1' : 'px-2 py-2'
      }`}
    >
      <div className={isKeyboardCompact ? 'grid gap-2' : 'grid gap-3'}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="m-0 text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
              {roundLabel}
            </p>
            <div className="flex flex-wrap items-baseline gap-2">
              <p
                className={`m-0 ${
                  isKeyboardCompact || isCompactLayout
                    ? 'text-sm font-semibold'
                    : 'text-base font-semibold'
                }`}
              >
                {sessionModeLabel}
              </p>
              {sessionSummaryLabel && !isKeyboardCompact ? (
                <p className="m-0 text-sm leading-[1.3] text-[var(--color-muted)]">
                  {sessionSummaryLabel}
                </p>
              ) : null}
            </div>
          </div>
          <div className="shrink-0">{topBarMenu}</div>
        </div>

        {!isCompactLayout && !isKeyboardCompact ? (
          <div className="flex flex-wrap gap-2">
            {sessionLabels.map((label) => (
              <span className="text-xs text-[var(--color-muted)]" key={label}>
                {label}
              </span>
            ))}
          </div>
        ) : null}

        <div className={isCompactLayout ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2'}>
          {statItems.map((item) => (
            <div
              className={`surface-display-neutral grid min-h-11 justify-items-center gap-[2px] rounded-full px-3 text-center ${
                isCompactLayout ? 'w-full py-2' : 'py-2'
              }`}
              key={item.label}
            >
              <p className="m-0 text-xs leading-[1.2] text-[var(--color-muted)]">{item.label}</p>
              <p className="m-0 text-sm font-semibold tabular-nums md:text-base">{item.value}</p>
            </div>
          ))}
          <div
            className={`surface-display-accent grid min-h-11 justify-items-center rounded-full px-3 ${
              isCompactLayout ? 'w-full py-2' : 'py-2'
            }`}
          >
            <GameTimer elapsedMs={displayElapsedMs} runningSince={runningSince} />
          </div>
          {showRefocus && !isCompactLayout ? (
            <Button
              aria-label={m.game_refocus_country_aria()}
              className="min-h-11 border-[rgba(150,201,255,0.22)] py-[7px]"
              size="sm"
              variant="contained"
              onClick={onRefocus}
            >
              {m.action_refocus()}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
