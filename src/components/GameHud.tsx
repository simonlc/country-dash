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
import {
  getChipShellSx,
  getEdgeAttachedPanelRadiusSx,
  getFloatingPanelSx,
} from '@/utils/controlStyles';

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
  const sessionModeVariant = isKeyboardCompact
    ? 'caption'
    : isCompactLayout
      ? 'subtitle2'
      : 'h6';
  const hudPanelSx = {
    ...getFloatingPanelSx({ compact: isDenseHud, maxWidth: '100%' }),
    ...getEdgeAttachedPanelRadiusSx({
      desktopRadius: designTokens.radius.md,
      mobileAttach: 'top',
      mobileFreeRadius: designTokens.radius.sm,
    }),
    pointerEvents: 'auto',
    paddingBlock: {
      md: designTokens.componentDensity.desktop.py,
      xs: isKeyboardCompact ? 0.6 : designTokens.componentDensity.mobile.py,
    },
    paddingBlockStart: {
      md: designTokens.componentDensity.desktop.py,
      xs: `max(${isKeyboardCompact ? 6 : 10}px, calc(env(safe-area-inset-top) + ${isKeyboardCompact ? 6 : 10}px))`,
    },
    paddingInline: {
      md: designTokens.componentDensity.desktop.px,
      xs: isKeyboardCompact ? 0.65 : designTokens.componentDensity.mobile.px,
    },
  } as const;
  const statContainerSx = isCompactLayout
    ? {
        display: 'grid',
        gap: 0.7,
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      }
    : {
        alignItems: 'stretch',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.7,
      };
  const chipShellSx = getChipShellSx({
    compact: isDenseHud,
    wrapped: isCompactLayout,
  });
  const baseChipSx = {
    alignContent: 'center',
    display: 'grid',
    flex: { md: '0 1 auto', xs: '1 1 auto' },
    gap: 0.2,
    inlineSize: { md: 'auto', xs: '100%' },
    justifyItems: 'center',
    minInlineSize: { md: 82, xs: 0 },
    textAlign: 'center',
  } as const;

  return (
    <Paper
      elevation={0}
      sx={[
        panelSurface,
        hudPanelSx,
      ]}
    >
      <Stack spacing={isKeyboardCompact ? 0.7 : 0.95}>
        <Stack alignItems="flex-start" direction="row" gap={1} justifyContent="space-between">
          <Stack spacing={0.2} sx={{ minInlineSize: 0 }}>
            <Typography
              color="text.secondary"
              letterSpacing="0.12em"
              textTransform="uppercase"
              variant="caption"
            >
              {roundLabel}
            </Typography>
            <Stack alignItems="baseline" direction="row" flexWrap="wrap" gap={0.6}>
              <Typography sx={{ overflowWrap: 'anywhere' }} variant={sessionModeVariant}>
                {sessionModeLabel}
              </Typography>
              {sessionSummaryLabel && !isKeyboardCompact ? (
                <Typography color="text.secondary" lineHeight={1.3} sx={{ overflowWrap: 'anywhere' }} variant="body2">
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

        <Box sx={statContainerSx}>
          {statItems.map((item) => (
            <Box
              key={item.label}
              sx={[
                displaySurface,
                chipShellSx,
                baseChipSx,
              ]}
            >
              <Typography
                color="text.secondary"
                lineHeight={1.2}
                sx={{ overflowWrap: 'anywhere' }}
                variant="caption"
              >
                {item.label}
              </Typography>
              <Typography
                lineHeight={1.05}
                sx={{
                  fontSize: {
                    md: theme.typography.subtitle1.fontSize,
                    xs: theme.typography.body1.fontSize,
                  },
                  fontVariantNumeric: 'tabular-nums',
                  overflowWrap: 'anywhere',
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
              chipShellSx,
              {
                alignContent: 'center',
                display: 'grid',
                flex: { md: '0 1 auto', xs: '1 1 auto' },
                inlineSize: { md: 'auto', xs: '100%' },
                justifyItems: 'center',
                minInlineSize: { md: 90, xs: 0 },
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
                minBlockSize: designTokens.touchTarget.min,
                paddingBlock: 0.85,
              }}
              variant="contained"
              onClick={onRefocus}
            >
              {m.action_refocus()}
            </Button>
          ) : null}
        </Box>
      </Stack>
    </Paper>
  );
}
