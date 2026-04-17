import { Box, Stack, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Award, CheckCircle, Clock, TrendingUp, XCircle } from 'react-feather';
import { designTokens } from '@/app/designSystem';
import { m } from '@/paraglide/messages.js';
import { UiActionButton } from '@/components/ui/UiActionButton';
import { UiCard } from '@/components/ui/UiCard';
import { UiIconBadge } from '@/components/ui/UiIconBadge';

interface ReviewStat {
  label: string;
  value: string;
}

interface GameStatusReviewContentProps {
  dividerColor: (theme: Theme) => string;
  isCorrect: boolean;
  isReviewComplete: boolean;
  onNextRound: () => void;
  playerGuess: string;
  reviewAnswer: string;
  reviewMetadata: string;
  reviewStats: ReviewStat[];
  showPlayerGuess: boolean;
  statusColor: 'error.main' | 'primary.main';
}

export function GameStatusReviewContent({
  dividerColor,
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
      <Stack
        role="status"
        aria-live="polite"
        spacing={0.45}
        sx={{ alignItems: 'center' }}
      >
        <UiIconBadge
          badgeColor={isCorrect ? 'primary.main' : 'error.main'}
          badgeTextColor={
            isCorrect
              ? 'primary.contrastText'
              : 'error.contrastText'
          }
        >
          {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
        </UiIconBadge>
        <Typography
          color={statusColor}
          sx={{
            fontSize: designTokens.fontSize.overline,
            fontWeight: designTokens.fontWeight.bold,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          {isCorrect ? m.game_correct_label() : m.game_missed()}
        </Typography>
        <Typography
          sx={{
            fontSize: 'clamp(1.65rem, 4.3vw, 2.1rem)',
            fontWeight: designTokens.fontWeight.bold,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
          }}
        >
          {reviewAnswer}
        </Typography>
        {reviewMetadata ? (
          <Typography color="text.secondary" variant="body2">
            {reviewMetadata}
          </Typography>
        ) : null}
      </Stack>
      {showPlayerGuess ? (
        <UiCard
          outlined
          sx={{
            px: { sm: 4, xs: 2 },
            py: 1,
            textAlign: 'center',
            inlineSize: '100%',
          }}
        >
          <Typography color="text.secondary" variant="caption">
            {m.game_your_guess()}
          </Typography>
          <Typography variant="body1">{playerGuess}</Typography>
        </UiCard>
      ) : null}
      <UiCard
        outlined
        sx={{
          borderColor: dividerColor,
          display: 'grid',
          gap: 0,
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          inlineSize: '100%',
        }}
      >
        {reviewStats.map((item, index) => (
          <Box
            key={item.label}
            sx={{
              background: 'transparent',
              paddingBlock: 0.95,
              paddingInline: 1.25,
              textAlign: 'center',
              ...(index === 0
                ? null
                : {
                    borderInlineStart: '1px solid',
                    borderInlineStartColor: dividerColor,
                  }),
            }}
          >
            <Stack spacing={0.4} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  alignItems: 'center',
                  color: 'primary.main',
                  display: 'inline-flex',
                  gap: 0.6,
                }}
              >
                {item.label === m.game_stat_time() ? (
                  <Clock size={14} />
                ) : (
                  <TrendingUp size={14} />
                )}
                <Typography color="text.secondary" variant="caption">
                  {item.label}
                </Typography>
              </Box>
              <Typography
                sx={{ fontVariantNumeric: 'tabular-nums' }}
                variant="subtitle1"
              >
                {item.value}
              </Typography>
            </Stack>
          </Box>
        ))}
      </UiCard>
      <UiActionButton
        autoFocus
        variant="contained"
        startIcon={isReviewComplete ? <Award size={15} /> : undefined}
        onClick={onNextRound}
        sx={{
          alignSelf: 'center',
          backgroundColor: 'primary.main',
          backgroundImage: 'none',
        }}
      >
        {isReviewComplete ? m.action_finish() : m.action_next()}
      </UiActionButton>
    </>
  );
}
