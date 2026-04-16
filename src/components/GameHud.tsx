import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { ReactNode } from 'react';
import { m } from '@/paraglide/messages.js';
import { designTokens } from '@/app/designSystem';
import type {
  getThemeDisplaySurfaceStyles,
  getThemeSurfaceStyles,
} from '@/app/theme';
import { GameTimer } from '@/components/GameTimer';

interface GameHudProps {
  correct: number;
  displayAccentSurface: ReturnType<typeof getThemeDisplaySurfaceStyles>;
  displayElapsedMs: number;
  displaySurface: ReturnType<typeof getThemeDisplaySurfaceStyles>;
  incorrect: number;
  isKeyboardOpen: boolean;
  livesRemaining: number | null;
  onRefocus: () => void;
  panelSurface: ReturnType<typeof getThemeSurfaceStyles>;
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
  displayAccentSurface,
  displayElapsedMs,
  displaySurface,
  incorrect,
  isKeyboardOpen,
  livesRemaining,
  onRefocus,
  panelSurface,
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
  const theme = useTheme();
  const isCompactLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const isKeyboardCompact = isCompactLayout && isKeyboardOpen;
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
    <Paper
      elevation={0}
      sx={[
        panelSurface,
        {
          borderRadius: 0,
          borderBottomLeftRadius: { md: designTokens.radius.pill, xs: designTokens.radius.sm },
          borderBottomRightRadius: { md: designTokens.radius.pill, xs: designTokens.radius.sm },
          pointerEvents: 'auto',
          px: { md: 2, xs: isKeyboardCompact ? 0.65 : 0.9 },
          py: { md: 1.2, xs: isKeyboardCompact ? 0.6 : 0.85 },
          pt: {
            md: 1.2,
            xs: `max(${isKeyboardCompact ? 6 : 10}px, calc(env(safe-area-inset-top) + ${isKeyboardCompact ? 6 : 10}px))`,
          },
          width: '100%',
        },
      ]}
    >
      <Stack spacing={isKeyboardCompact ? 0.7 : 0.95}>
        <Stack alignItems="flex-start" direction="row" gap={1} justifyContent="space-between">
          <Stack minWidth={0} spacing={0.2}>
            <Typography
              color="text.secondary"
              letterSpacing="0.12em"
              textTransform="uppercase"
              variant="caption"
            >
              {roundLabel}
            </Typography>
            <Stack alignItems="baseline" direction="row" flexWrap="wrap" gap={0.6}>
              <Typography variant={isKeyboardCompact ? 'caption' : isCompactLayout ? 'subtitle2' : 'h6'}>
                {sessionModeLabel}
              </Typography>
              {sessionSummaryLabel && !isKeyboardCompact ? (
                <Typography color="text.secondary" lineHeight={1.3} variant="body2">
                  {sessionSummaryLabel}
                </Typography>
              ) : null}
            </Stack>
          </Stack>
          <Box flexShrink={0}>{topBarMenu}</Box>
        </Stack>

        {!isCompactLayout && !isKeyboardCompact ? (
          <Stack direction="row" flexWrap="wrap" gap={0.6}>
            {sessionLabels.map((label) => (
              <Typography key={label} color="text.secondary" variant="caption">
                {label}
              </Typography>
            ))}
          </Stack>
        ) : null}

        <Stack direction="row" flexWrap="wrap" gap={0.7}>
          {statItems.map((item) => (
            <Box
              key={item.label}
              sx={[
                displaySurface,
                {
                  borderRadius: { md: designTokens.radius.pill, xs: designTokens.radius.sm },
                  flex: { md: '0 1 auto', xs: '1 1 calc(33.333% - 6px)' },
                  minWidth: { md: 74, xs: 0 },
                  px: { md: designTokens.componentSpacing.hudChip.px, xs: 0.85 },
                  py: { md: designTokens.componentSpacing.hudChip.py, xs: isKeyboardCompact ? 0.35 : 0.5 },
                  textAlign: 'center',
                },
              ]}
            >
              <Typography color="text.secondary" lineHeight={1} variant="caption">
                {item.label}
              </Typography>
              <Typography
                lineHeight={1.05}
                sx={{
                  fontSize: { md: theme.typography.subtitle1.fontSize, xs: theme.typography.body1.fontSize },
                  fontVariantNumeric: 'tabular-nums',
                }}
                variant="subtitle2"
              >
                {item.value}
              </Typography>
            </Box>
          ))}
          <Paper
            elevation={0}
            sx={[
              displayAccentSurface,
              {
                borderRadius: { md: designTokens.radius.pill, xs: designTokens.radius.sm },
                flex: { md: '0 1 auto', xs: '1 1 calc(33.333% - 6px)' },
                minWidth: { md: 86, xs: 0 },
                px: { md: designTokens.componentSpacing.hudChip.px, xs: 0.85 },
                py: { md: designTokens.componentSpacing.hudChip.py, xs: 0.5 },
              },
            ]}
          >
            <GameTimer elapsedMs={displayElapsedMs} runningSince={runningSince} />
          </Paper>
          {showRefocus && !isCompactLayout ? (
            <Button
              aria-label={m.game_refocus_country_aria()}
              size="small"
              sx={{
                borderColor: 'rgba(150, 201, 255, 0.22)',
                minHeight: 38,
                py: 0.85,
              }}
              variant="contained"
              onClick={onRefocus}
            >
              {m.action_refocus()}
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
}
