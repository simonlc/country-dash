import { Award, Clock, Home, RotateCcw, Share2, TrendingUp } from 'react-feather';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import type { GameState } from '@/types/game';
import { formatElapsed } from '@/utils/gameLogic';

interface GameStatusGameOverContentProps {
  copyState: 'idle' | 'copied' | 'failed';
  dailyShareText: string | null;
  gameOverMeta: string;
  gameOverSummary: string;
  gameState: GameState;
  isDailyRun: boolean;
  onCopyDailyShare: () => Promise<void>;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

export function GameStatusGameOverContent({
  copyState,
  dailyShareText,
  gameOverMeta,
  gameOverSummary,
  gameState,
  isDailyRun,
  onCopyDailyShare,
  onPlayAgain,
  onReturnToMenu,
}: GameStatusGameOverContentProps) {
  return (
    <>
      <div className="grid justify-items-center gap-1">
        <IconBadge>
          <Award size={16} />
        </IconBadge>
        <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          {isDailyRun ? m.game_daily_complete() : m.game_run_complete()}
        </p>
        <p className="m-0 text-[clamp(1.9rem,5vw,2.5rem)] font-bold leading-none tracking-[-0.03em]">
          {gameOverSummary}
        </p>
        <p className="m-0 text-sm text-[var(--color-muted)]">{gameOverMeta}</p>
      </div>

      {isDailyRun && dailyShareText ? (
        <>
          <Card className="surface-display-accent rounded-sm p-3">
            <pre className="m-0 whitespace-pre-wrap font-inherit">{dailyShareText}</pre>
          </Card>
          <Button
            startIcon={<Share2 size={15} />}
            variant="outlined"
            onClick={() => {
              void onCopyDailyShare();
            }}
          >
            {copyState === 'copied'
              ? m.game_copied()
              : copyState === 'failed'
                ? m.game_copy_failed()
                : m.action_copy_results()}
          </Button>
        </>
      ) : null}

      {!isDailyRun ? (
        <Card className="grid w-full grid-cols-2 border" tone="outlined">
          {[
            {
              icon: TrendingUp,
              label: m.game_stat_score(),
              value: gameState.score,
            },
            {
              icon: Clock,
              label: m.game_stat_time(),
              value: formatElapsed(gameState.totalElapsedMs),
            },
          ].map((item, index) => (
            <div
              className={`px-3 py-2 text-center ${index === 0 ? '' : 'border-s border-[var(--color-border)]'}`}
              key={item.label}
            >
              <div className="grid justify-items-center gap-1">
                <div className="inline-flex items-center gap-1 text-[var(--color-primary)]">
                  <item.icon size={14} />
                  <span className="text-xs text-[var(--color-muted)]">{item.label}</span>
                </div>
                <p className="m-0 text-base font-semibold tabular-nums">{item.value}</p>
              </div>
            </div>
          ))}
        </Card>
      ) : null}

      <div className="grid w-full justify-center gap-2 sm:flex">
        {!isDailyRun ? (
          <Button
            className="bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
            startIcon={<RotateCcw size={15} />}
            variant="contained"
            onClick={onPlayAgain}
          >
            {m.action_play_again()}
          </Button>
        ) : null}
        <Button
          className={isDailyRun ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)]' : ''}
          startIcon={<Home size={15} />}
          variant={!isDailyRun ? 'outlined' : 'contained'}
          onClick={onReturnToMenu}
        >
          {m.action_main_menu()}
        </Button>
      </div>
    </>
  );
}
