import { Box, Stack, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Award, Clock, Home, RotateCcw, Share2, TrendingUp } from 'react-feather';
import { designTokens } from '@/app/designSystem';
import { m } from '@/paraglide/messages.js';
import { UiActionButton } from '@/components/ui/UiActionButton';
import { UiCard } from '@/components/ui/UiCard';
import { UiIconBadge } from '@/components/ui/UiIconBadge';
import type { GameState } from '@/types/game';
import type { getThemeDisplaySurfaceStyles } from '@/app/theme';
import { formatElapsed } from '@/utils/gameLogic';

interface GameStatusGameOverContentProps {
  copyState: 'idle' | 'copied' | 'failed';
  dailyShareText: string | null;
  displaySurface: ReturnType<typeof getThemeDisplaySurfaceStyles>;
  dividerColor: (theme: Theme) => string;
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
  displaySurface,
  dividerColor,
  gameOverMeta,
  gameOverSummary,
  gameState,
  isDailyRun,
  onCopyDailyShare,
  onPlayAgain,
  onReturnToMenu,
}: GameStatusGameOverContentProps) {
  const dailyMainMenuSx = isDailyRun
    ? {
        backgroundColor: 'primary.main',
        backgroundImage: 'none',
      }
    : null;

  return (
    <>
      <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
        <UiIconBadge badgeColor="primary.main" badgeTextColor="primary.contrastText">
          <Award size={16} />
        </UiIconBadge>
        <Typography
          sx={{
            color: 'primary.main',
            fontSize: designTokens.fontSize.overline,
            fontWeight: designTokens.fontWeight.bold,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          {isDailyRun ? m.game_daily_complete() : m.game_run_complete()}
        </Typography>
        <Typography
          sx={{
            fontSize: 'clamp(1.9rem, 5vw, 2.5rem)',
            fontWeight: designTokens.fontWeight.bold,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {gameOverSummary}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {gameOverMeta}
        </Typography>
      </Stack>
      {isDailyRun && dailyShareText ? (
        <>
          <UiCard
            sx={{
              ...displaySurface,
              borderRadius: { sm: designTokens.radius.md, xs: designTokens.radius.xs },
              backgroundImage: 'none',
              p: 1.5,
            }}
          >
            <Typography
              component="pre"
              sx={{
                fontFamily: 'inherit',
                m: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {dailyShareText}
            </Typography>
          </UiCard>
          <UiActionButton
            variant="outlined"
            startIcon={<Share2 size={15} />}
            onClick={() => {
              void onCopyDailyShare();
            }}
          >
            {copyState === 'copied'
              ? m.game_copied()
              : copyState === 'failed'
                ? m.game_copy_failed()
                : m.action_copy_results()}
          </UiActionButton>
        </>
      ) : null}
      {!isDailyRun ? (
        <UiCard
          outlined
          sx={{
            borderColor: dividerColor,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            inlineSize: '100%',
          }}
        >
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
            <Box
              key={item.label}
              sx={{
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
                  <item.icon size={14} />
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
      ) : null}
      <Stack
        alignSelf="center"
        direction={{ sm: 'row', xs: 'column' }}
        justifyContent="center"
        spacing={0.85}
        sx={{ inlineSize: '100%' }}
      >
        {!isDailyRun ? (
          <UiActionButton
            variant="contained"
            startIcon={<RotateCcw size={15} />}
            onClick={onPlayAgain}
            sx={{
              backgroundColor: 'primary.main',
              backgroundImage: 'none',
            }}
          >
            {m.action_play_again()}
          </UiActionButton>
        ) : null}
        <UiActionButton
          variant={!isDailyRun ? 'outlined' : 'contained'}
          startIcon={<Home size={15} />}
          onClick={onReturnToMenu}
          {...(dailyMainMenuSx ? { sx: dailyMainMenuSx } : {})}
        >
          {m.action_main_menu()}
        </UiActionButton>
      </Stack>
    </>
  );
}
