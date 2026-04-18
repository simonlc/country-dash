import { GameTimer } from '@/components/GameTimer';
import { Menu } from '@/components/Menu';
import { HudInfo } from '@/components/ui/hud-info';
import { gameStateAtom } from '@/game/state/game-atoms';
import { totalRoundsAtom } from '@/game/state/game-derived-atoms';
import { m } from '@/paraglide/messages.js';
import type { GameState } from '@/types/game';
import { getCountrySizeLabel, getRegionLabel } from '@/utils/labelTranslations';
import { useAtomValue } from 'jotai';

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
  // const sessionModeLabel = getSessionModeLabel(gameState);
  const sessionSummaryLabel = getSessionSummaryLabel(gameState);
  const roundLabel =
    gameState.status === 'intro'
      ? `${m.game_round_ready()}`
      : `${m.game_round()}`;

  const rounds = `${gameState.roundIndex + 1} / ${totalRounds}`;
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
  // const incorrect = gameState.incorrect;
  const livesRemaining = gameState.livesRemaining;
  const score = gameState.score;
  const streak = gameState.streak;
  const statItems = [
    { label: m.game_stat_score(), value: score },
    { label: m.game_stat_streak(), value: streak },
    { label: m.game_stat_hit(), value: correct },
    // { label: m.game_stat_miss(), value: incorrect },
    ...(livesRemaining !== null
      ? [{ label: m.game_stat_lives(), value: livesRemaining }]
      : []),
  ];

  return (
    <section className="surface-elevated w-full rounded-b-xl md:rounded-full grid gap-2 py-2 px-12">
      <div className="grid grid-cols-3 grid-flow-col justify-between items-center gap-2">
        <div className="font-bold text-lg">Country Dash</div>
        <GameTimer />
        <div className="justify-self-end">
          <Menu />
        </div>
      </div>
      <div className="flex justify-between gap-2">
        <div className="flex gap-4 items-center">
          {/* TODO: Translate */}
          {sessionSummaryLabel ? (
            <HudInfo title="Region" value={sessionSummaryLabel} />
          ) : null}
          {/* <div className="font-semibold">{sessionModeLabel}</div> */}
          <HudInfo title={roundLabel} value={rounds} />
        </div>

        {/* <div className="flex flex-wrap gap-2"> */}
        {/*   {sessionLabels.map((label) => ( */}
        {/*     <span className="text-xs text-muted" key={label}> */}
        {/*       {label} */}
        {/*     </span> */}
        {/*   ))} */}
        {/* </div> */}

        <div className="flex gap-2">
          {statItems.map((item) => (
            <HudInfo key={item.label} title={item.label} value={item.value} />
          ))}
        </div>
      </div>
    </section>
  );
}
