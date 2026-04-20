import NiceModal from '@ebay/nice-modal-react';
import { Info, MapPin, XCircle } from 'react-feather';
import { mobileLayoutMediaQuery } from '@/app/layoutBreakpoints';
import { GameTimer } from '@/components/GameTimer';
import { HowToPlayDialog } from '@/components/HowToPlayDialog';
import { Menu } from '@/components/Menu';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/components/ui/theme-provider';
import { gameStateAtom } from '@/game/state/game-atoms';
import { totalRoundsAtom } from '@/game/state/game-derived-atoms';
import { m } from '@/paraglide/messages.js';
import type { GameState } from '@/types/game';
import { getCountrySizeLabel, getRegionLabel } from '@/utils/labelTranslations';
import { useAtomValue } from 'jotai';
import { cn } from '@/lib/utils';

function getSessionSummaryLabel(gameState: GameState) {
  if (!gameState.sessionConfig) {
    return '';
  }

  if (gameState.sessionConfig.kind === 'daily') {
    return `${m.pool_global()}`;
  }

  if (gameState.regionFilter) {
    return getRegionLabel(gameState.regionFilter);
  }

  return getCountrySizeLabel(gameState.countrySizeFilter);
}

// function getSessionModeLabel(gameState: GameState) {
//   if (!gameState.sessionConfig) {
//     return `${m.session_mode_none()}`;
//   }
//
//   return getModeLabel(gameState.sessionConfig.mode);
// }

export function GameHud() {
  const gameState = useAtomValue(gameStateAtom);
  const totalRounds = useAtomValue(totalRoundsAtom);
  const isMobileViewport = useMediaQuery(mobileLayoutMediaQuery);
  // const sessionModeLabel = getSessionModeLabel(gameState);
  const sessionSummaryLabel = getSessionSummaryLabel(gameState);
  const roundLabel =
    gameState.status === 'intro'
      ? `${m.game_round_ready()}`
      : `${m.game_round()}`;

  const rounds = `${gameState.roundIndex + 1} / ${totalRounds}`;
  const compactRounds = `${gameState.roundIndex + 1}/${totalRounds}`;
  // const sessionLabels = [
  //   `${m.session_label_type({
  //     value: getSessionTypeLabel(gameState.sessionConfig?.kind ?? null),
  //   })}`,
  //   `${m.session_label_mode({ value: sessionModeLabel })}`,
  //   sessionSummaryLabel
  //     ? `${m.session_label_pool({ value: sessionSummaryLabel })}`
  //     : null,
  // ].filter((value): value is string => Boolean(value));
  const correct = gameState.correct;
  const incorrect = gameState.incorrect;
  const livesRemaining = gameState.livesRemaining;
  const score = gameState.score;
  const streak = gameState.streak;
  const scoreLabel = m.game_stat_score();
  const sessionDetailLabel = sessionSummaryLabel
    ? m.session_label_pool({ value: sessionSummaryLabel })
    : null;
  const desktopMetricItems = [
    { label: roundLabel, value: rounds },
    { label: scoreLabel, value: score },
    { label: m.game_stat_streak(), value: streak },
    { label: m.game_stat_hit(), value: correct },
    { label: m.game_stat_miss(), value: incorrect },
    ...(livesRemaining !== null
      ? [{ label: m.game_stat_lives(), value: livesRemaining }]
      : []),
  ];

  if (isMobileViewport) {
    return (
      <section className="surface-elevated flex w-full items-center justify-between px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            aria-label={`${roundLabel}: ${compactRounds}`}
            className="surface-display-neutral flex items-center gap-1.5 rounded-full px-2.5 py-1"
          >
            <MapPin
              aria-hidden
              className="shrink-0 text-[var(--color-primary)]"
              size={14}
            />
            <span className="text-sm font-semibold tabular-nums">
              {compactRounds}
            </span>
          </div>
          <div
            aria-label={`${m.game_stat_miss()}: ${incorrect}`}
            className="surface-display-neutral flex items-center gap-1.5 rounded-full px-2.5 py-1"
          >
            <XCircle
              aria-hidden
              className="shrink-0 text-neutral-500"
              size={14}
            />
            <span className="text-sm font-semibold tabular-nums">
              {incorrect}
            </span>
          </div>
        </div>
        <div className="pointer-events-auto relative flex shrink-0 items-center gap-2">
          <Button
            aria-label={m.action_how_to_play()}
            className="surface-elevated min-h-9 min-w-9 rounded-full border border-[var(--surface-panel-border)] p-0 text-primary"
            size="sm"
            variant="text"
            onClick={() => {
              void NiceModal.show(HowToPlayDialog);
            }}
          >
            <Info aria-hidden size={16} />
          </Button>
          <Menu iconSize={16} triggerClassName="min-h-9 min-w-9" />
        </div>
      </section>
    );
  }

  return (
    <section className="surface-elevated w-full rounded-[24px] px-4 py-4 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-[1.375rem] font-semibold tracking-[-0.03em] text-[var(--color-foreground)]">
            Country Dash
          </div>
          {sessionDetailLabel ? (
            <p className="mt-1 truncate text-sm text-[var(--color-muted)]">
              {sessionDetailLabel}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <GameTimer valueClassName="text-[1.85rem] font-semibold leading-none tracking-[-0.05em]" />
          <Menu triggerClassName="min-h-11 min-w-11 rounded-full" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[color:color-mix(in_srgb,var(--color-foreground)_12%,transparent)] pt-3">
        {desktopMetricItems.map((item) => (
          <div className="flex items-baseline gap-2 whitespace-nowrap" key={item.label}>
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              {item.label}
            </span>
            <span
              className={cn(
                'text-sm font-semibold text-[var(--color-foreground)]',
                'tabular-nums',
                item.label === scoreLabel ? 'text-[var(--color-primary)]' : null,
              )}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
