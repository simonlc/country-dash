import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
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
}: GameHudProps) {
  const theme = useTheme();
  const isCompactLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const isKeyboardCompact = isCompactLayout && isKeyboardOpen;
  const mobileHudContentOffset = 'calc(env(safe-area-inset-top) + 56px)';
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
          borderRadius: { md: designTokens.radius.pill, xs: '0 0 4px 4px' },
          flex: 1,
          p: {
            md: designTokens.componentSpacing.dialogPanel.desktop,
            xs: isKeyboardCompact ? 0.55 : 0.85,
          },
          pt: {
            md: designTokens.componentSpacing.dialogPanel.desktop,
            xs: isKeyboardCompact
              ? 'calc(env(safe-area-inset-top) + 52px)'
              : mobileHudContentOffset,
          },
          pointerEvents: 'auto',
        },
      ]}
    >
      <Box
        sx={{
          alignItems: 'center',
          display: 'grid',
          gap: isKeyboardCompact ? 0.65 : 1,
          paddingLeft: { md: 3, xs: isKeyboardCompact ? 0 : 0.25 },
          paddingRight: { md: 1, xs: 0 },
          gridTemplateColumns: {
            md: 'minmax(0, 1.3fr) auto auto auto auto auto auto',
            sm: 'repeat(4, minmax(0, 1fr))',
            xs: isKeyboardCompact ? 'repeat(4, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        <Stack
          spacing={0.15}
          sx={{
            gridColumn: {
              xs: isKeyboardCompact ? '1 / span 2' : '1 / -1',
              md: 'auto',
            },
          }}
        >
          <Typography
            color="text.secondary"
            letterSpacing="0.12em"
            textTransform="uppercase"
            variant="caption"
          >
            {roundLabel}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.6}>
            <Typography variant={isKeyboardCompact ? 'caption' : isCompactLayout ? 'subtitle2' : 'h6'}>
              {sessionModeLabel}
            </Typography>
            {sessionSummaryLabel && !isCompactLayout && !isKeyboardCompact ? (
              <Typography
                color="text.secondary"
                lineHeight={1.3}
                variant="body2"
              >
                {sessionSummaryLabel}
              </Typography>
            ) : null}
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
        </Stack>
        {statItems.map((item) => (
          <Box
            key={item.label}
            sx={[
              displaySurface,
              {
                borderRadius: { md: designTokens.radius.pill, xs: designTokens.radius.sm },
                minWidth: { md: 74, sm: 64, xs: 0 },
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
              gridColumn: { xs: 'span 1', md: 'auto' },
              justifySelf: { md: 'end', xs: 'stretch' },
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
              gridColumn: { xs: 'span 2', md: 'auto' },
              minHeight: 38,
              py: 0.85,
            }}
            variant="contained"
            onClick={onRefocus}
          >
            {m.action_refocus()}
          </Button>
        ) : null}
      </Box>
    </Paper>
  );
}
