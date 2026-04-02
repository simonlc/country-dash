import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { designTokens } from '@/app/designSystem';
import {
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
  return (
    <Paper
      elevation={0}
      sx={[
        panelSurface,
        {
          borderRadius: designTokens.radius.pill,
          flex: 1,
          p: {
            md: designTokens.componentSpacing.dialogPanel.desktop,
            xs: 1.4,
          },
          pointerEvents: 'auto',
        },
      ]}
    >
      <Box
        sx={{
          alignItems: 'center',
          display: 'grid',
          gap: 1,
          gridTemplateColumns: {
            md: 'minmax(0, 1.3fr) auto auto auto auto auto auto',
            xs: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        <Stack
          spacing={0.15}
          sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}
        >
          <Typography
            color="text.secondary"
            letterSpacing="0.12em"
            textTransform="uppercase"
            variant="caption"
          >
            {roundLabel}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            <Typography variant="h6">{sessionModeLabel}</Typography>
            {sessionSummaryLabel ? (
              <Typography color="text.secondary" lineHeight={1.3} variant="body2">
                {sessionSummaryLabel}
              </Typography>
            ) : null}
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={0.6}>
            {sessionLabels.map((label) => (
              <Typography key={label} color="text.secondary" variant="caption">
                {label}
              </Typography>
            ))}
          </Stack>
        </Stack>
        {[
          { label: 'Score', value: score },
          { label: 'Streak', value: streak },
          { label: 'Hit', value: correct },
          { label: 'Miss', value: incorrect },
          ...(livesRemaining !== null
            ? [{ label: 'Lives', value: livesRemaining }]
            : []),
        ].map((item) => (
          <Box
            key={item.label}
            sx={[
              displaySurface,
              {
                borderRadius: designTokens.radius.pill,
                minWidth: { md: 74, xs: 0 },
                px: designTokens.componentSpacing.hudChip.px,
                py: designTokens.componentSpacing.hudChip.py,
                textAlign: 'center',
              },
            ]}
          >
            <Typography color="text.secondary" lineHeight={1} variant="caption">
              {item.label}
            </Typography>
            <Typography
              lineHeight={1.05}
              sx={{ fontVariantNumeric: 'tabular-nums' }}
              variant="subtitle1"
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
              borderRadius: designTokens.radius.pill,
              gridColumn: { xs: 'span 2', md: 'auto' },
              justifySelf: { md: 'end', xs: 'stretch' },
              px: designTokens.componentSpacing.hudChip.px,
              py: designTokens.componentSpacing.hudChip.py,
            },
          ]}
        >
          <GameTimer elapsedMs={displayElapsedMs} runningSince={runningSince} />
        </Paper>
        {showRefocus ? (
          <Button
            aria-label="Refocus country"
            size="small"
            sx={{
              borderColor: 'rgba(150, 201, 255, 0.22)',
              gridColumn: { xs: 'span 2', md: 'auto' },
              py: 0.85,
            }}
            variant="contained"
            onClick={onRefocus}
          >
            Refocus
          </Button>
        ) : null}
      </Box>
    </Paper>
  );
}
