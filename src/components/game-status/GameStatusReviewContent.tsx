import { Award, CheckCircle, Clock, TrendingUp, XCircle } from 'react-feather';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';

interface ReviewStat {
  label: string;
  value: string;
}

interface GameStatusReviewContentProps {
  isCorrect: boolean;
  isReviewComplete: boolean;
  onNextRound: () => void;
  playerGuess: string;
  reviewAnswer: string;
  reviewMetadata: string;
  reviewStats: ReviewStat[];
  showPlayerGuess: boolean;
  statusColor: 'error.main' | 'success.main';
}

export function GameStatusReviewContent({
  isCorrect,
  isReviewComplete,
  onNextRound,
  playerGuess,
  reviewAnswer,
  reviewMetadata,
  reviewStats,
  showPlayerGuess,
  statusColor,
}: GameStatusReviewContentProps) {
  return (
    <>
      <div aria-live="polite" className="grid justify-items-center gap-1" role="status">
        <IconBadge tone={isCorrect ? 'success' : 'danger'}>
          {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
        </IconBadge>
        <p
          className={`m-0 text-[0.68rem] font-bold uppercase tracking-[0.18em] ${
            statusColor === 'success.main'
              ? 'text-[var(--color-success)]'
              : 'text-[#d54b41]'
          }`}
        >
          {isCorrect ? m.game_correct_label() : m.game_missed()}
        </p>
        <p className="m-0 text-[clamp(1.65rem,4.3vw,2.1rem)] font-bold leading-[1.05] tracking-[-0.03em]">
          {reviewAnswer}
        </p>
        {reviewMetadata ? (
          <p className="m-0 text-sm text-[var(--color-muted)]">{reviewMetadata}</p>
        ) : null}
      </div>
      {showPlayerGuess ? (
        <Card className="w-full px-4 py-2 text-center" tone="outlined">
          <p className="m-0 text-xs text-[var(--color-muted)]">{m.game_your_guess()}</p>
          <p className="m-0 text-base">{playerGuess}</p>
        </Card>
      ) : null}
      <Card className="grid w-full grid-cols-2 gap-0 border" tone="outlined">
        {reviewStats.map((item, index) => (
          <div
            className={`bg-transparent px-3 py-2 text-center ${index === 0 ? '' : 'border-s border-[var(--color-border)]'}`}
            key={item.label}
          >
            <div className="grid justify-items-center gap-1">
              <div className="inline-flex items-center gap-1 text-[var(--color-primary)]">
                {item.label === m.game_stat_time() ? (
                  <Clock size={14} />
                ) : (
                  <TrendingUp size={14} />
                )}
                <span className="text-xs text-[var(--color-muted)]">{item.label}</span>
              </div>
              <p className="m-0 text-base font-semibold tabular-nums">{item.value}</p>
            </div>
          </div>
        ))}
      </Card>
      <Button
        autoFocus
        className="self-center bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
        startIcon={isReviewComplete ? <Award size={15} /> : undefined}
        variant="contained"
        onClick={onNextRound}
      >
        {isReviewComplete ? m.action_finish() : m.action_next()}
      </Button>
    </>
  );
}
