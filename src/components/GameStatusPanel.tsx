import type { Theme } from '@mui/material/styles';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import {
  Award,
  CheckCircle,
  Clock,
  Home,
  RotateCcw,
  Share2,
  TrendingUp,
  XCircle,
} from 'react-feather';
import { designTokens } from '@/app/designSystem';
import type {
  getThemeDisplaySurfaceStyles,
  getThemeSurfaceStyles,
} from '@/app/theme';
import { GuessInput } from '@/components/GuessInput';
import { formatElapsed } from '@/utils/gameLogic';
import type { CountryProperties, GameState } from '@/types/game';

interface GameStatusPanelProps {
  copyState: 'idle' | 'copied' | 'failed';
  countryOptions: CountryProperties[];
  dailyShareText: string | null;
  displaySurface: ReturnType<typeof getThemeDisplaySurfaceStyles>;
  gameState: GameState;
  isCapitalMode: boolean;
  isDailyRun: boolean;
  isReviewComplete: boolean;
  onCopyDailyShare: () => Promise<void>;
  onNextRound: () => void;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
  onSubmit: (term: string) => void;
  panelSurface: ReturnType<typeof getThemeSurfaceStyles>;
  storedDailyResult: {
    correctCount: number;
    totalCount: number;
  } | null;
  totalRounds: number;
}

export function GameStatusPanel({
  copyState,
  countryOptions,
  dailyShareText,
  displaySurface,
  gameState,
  isCapitalMode,
  isDailyRun,
  isReviewComplete,
  onCopyDailyShare,
  onNextRound,
  onPlayAgain,
  onReturnToMenu,
  onSubmit,
  panelSurface,
  storedDailyResult,
  totalRounds,
}: GameStatusPanelProps) {
  const isPlaying = gameState.status === 'playing';
  const isReviewing =
    gameState.status === 'reviewing' && gameState.lastRound !== null;
  const isResultView = isReviewing || gameState.status === 'gameOver';
  const reviewAnswer = gameState.lastRound
    ? isCapitalMode
      ? (gameState.lastRound.capitalName ?? gameState.lastRound.countryName)
      : gameState.lastRound.countryName
    : '';
  const reviewMetadata = gameState.lastRound
    ? [
        isCapitalMode ? gameState.lastRound.countryName : null,
        gameState.lastRound.continent,
        gameState.lastRound.subregion,
      ]
        .filter((value): value is string => Boolean(value))
        .join(' • ')
    : '';
  const playerGuess = gameState.lastRound?.playerGuess.trim() || 'No answer';
  const showPlayerGuess =
    gameState.lastRound?.answerResult === 'incorrect' ||
    playerGuess === 'No answer';
  const reviewStats = gameState.lastRound
    ? [
        {
          label: 'Time',
          value: formatElapsed(gameState.lastRound.roundElapsedMs),
        },
        {
          label: 'Score',
          value: `${gameState.lastRound.scoreDelta >= 0 ? '+' : ''}${
            gameState.lastRound.scoreDelta
          }`,
        },
      ]
    : [];
  const gameOverSummary = isDailyRun
    ? `${gameState.correct}/${totalRounds} correct today`
    : `${gameState.correct}/${totalRounds} correct`;
  const gameOverMeta = isDailyRun
    ? `Best streak ${gameState.bestStreak} • ${formatElapsed(
        gameState.totalElapsedMs,
      )}`
    : `${gameState.score} points • Best streak ${gameState.bestStreak} • ${formatElapsed(
        gameState.totalElapsedMs,
      )}`;
  const isCorrect = gameState.lastRound?.answerResult === 'correct';
  const statusColor = isCorrect ? 'primary.main' : 'error.main';
  const dividerColor = (theme: Theme) =>
    theme.vars?.palette.divider ?? theme.palette.divider;

  const flatActionButtonSx = {
    borderRadius: designTokens.radius.sm,
    boxShadow: 'none',
    minWidth: { sm: 168, xs: 160 },
    px: 2.5,
    textAlign: 'center',
    '&:hover': {
      backgroundImage: 'none',
      boxShadow: 'none',
      transform: 'none',
    },
  } as const;

  return (
    <Paper
      elevation={0}
      sx={[
        panelSurface,
        {
          alignSelf: 'end',
          ...(isResultView
            ? {
                backgroundImage: 'none',
                boxShadow: 'none',
              }
            : null),
          borderRadius: designTokens.radius.xs,
          maxWidth: 560,
          mb: {
            // md: 16,
            // xs: 8,
            md: isPlaying ? 16 : 4,
            xs: isPlaying ? 8 : 2,
          },
          p: {
            md: designTokens.componentSpacing.overlayPanel.desktop,
            xs: designTokens.componentSpacing.overlayPanel.mobile,
          },
          pointerEvents: 'auto',
          overflow: 'visible',
          textAlign: 'center',
          width: '100%',
        },
      ]}
    >
      <Stack spacing={isResultView ? 1.1 : 2}>
        {gameState.status === 'gameOver' ? (
          <>
            <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  alignItems: 'center',
                  bgcolor: 'primary.main',
                  borderRadius: designTokens.radius.sm,
                  color: 'primary.contrastText',
                  display: 'grid',
                  height: 36,
                  justifyItems: 'center',
                  width: 36,
                }}
              >
                <Award size={16} />
              </Box>
              <Typography
                sx={{
                  color: 'primary.main',
                  fontSize: designTokens.fontSize.overline,
                  fontWeight: designTokens.fontWeight.bold,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                {isDailyRun ? 'Daily complete' : 'Run complete'}
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
            {isDailyRun ? (
              <>
                {dailyShareText ? (
                  <>
                    <Paper
                      elevation={0}
                      sx={[
                        displaySurface,
                        {
                          borderRadius: designTokens.radius.md,
                          backgroundImage: 'none',
                          p: 1.5,
                        },
                      ]}
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
                    </Paper>
                    <Button
                      variant="outlined"
                      startIcon={<Share2 size={15} />}
                      onClick={() => {
                        void onCopyDailyShare();
                      }}
                      sx={flatActionButtonSx}
                    >
                      {copyState === 'copied'
                        ? 'Copied'
                        : copyState === 'failed'
                          ? 'Copy failed'
                          : 'Copy results'}
                    </Button>
                  </>
                ) : null}
              </>
            ) : null}
            {!isDailyRun ? (
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: dividerColor,
                  borderRadius: designTokens.radius.md,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  width: '100%',
                }}
              >
                {[
                  {
                    icon: TrendingUp,
                    label: 'Score',
                    value: gameState.score,
                  },
                  {
                    icon: Clock,
                    label: 'Time',
                    value: formatElapsed(gameState.totalElapsedMs),
                  },
                ].map((item, index) => (
                  <Box
                    key={item.label}
                    sx={{
                      px: 1.25,
                      py: 0.95,
                      textAlign: 'center',
                      ...(index === 0
                        ? null
                        : {
                            borderLeft: '1px solid',
                            borderLeftColor: dividerColor,
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
              </Box>
            ) : null}
            <Stack
              alignSelf="center"
              direction={{ sm: 'row', xs: 'column' }}
              justifyContent="center"
              spacing={0.85}
            >
              {!isDailyRun ? (
                <Button
                  variant="contained"
                  startIcon={<RotateCcw size={15} />}
                  onClick={onPlayAgain}
                  sx={[
                    flatActionButtonSx,
                    {
                      backgroundColor: 'primary.main',
                      backgroundImage: 'none',
                    },
                  ]}
                >
                  Play again
                </Button>
              ) : null}
              <Button
                variant={!isDailyRun ? 'outlined' : 'contained'}
                startIcon={<Home size={15} />}
                onClick={onReturnToMenu}
                sx={[
                  flatActionButtonSx,
                  !isDailyRun
                    ? null
                    : {
                        backgroundColor: 'primary.main',
                        backgroundImage: 'none',
                      },
                ]}
              >
                Main menu
              </Button>
            </Stack>
          </>
        ) : isReviewing && gameState.lastRound ? (
          <>
            <Stack
              role="status"
              aria-live="polite"
              spacing={0.45}
              sx={{ alignItems: 'center' }}
            >
              <Box
                sx={{
                  alignItems: 'center',
                  bgcolor: isCorrect ? 'primary.main' : 'error.main',
                  borderRadius: designTokens.radius.sm,
                  color: isCorrect
                    ? 'primary.contrastText'
                    : 'error.contrastText',
                  display: 'grid',
                  height: 36,
                  justifyItems: 'center',
                  width: 36,
                }}
              >
                {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
              </Box>
              <Typography
                color={statusColor}
                sx={{
                  fontSize: designTokens.fontSize.overline,
                  fontWeight: designTokens.fontWeight.bold,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                {isCorrect ? 'Correct' : 'Missed'}
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
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: dividerColor,
                  borderRadius: designTokens.radius.md,
                  px: 4,
                  py: 1,
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                <Typography color="text.secondary" variant="caption">
                  Your guess
                </Typography>
                <Typography variant="body1">{playerGuess}</Typography>
              </Box>
            ) : null}
            <Box
              sx={{
                border: '1px solid',
                borderColor: dividerColor,
                borderRadius: designTokens.radius.md,
                display: 'grid',
                gap: 0,
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                width: '100%',
              }}
            >
              {reviewStats.map((item, index) => (
                <Box
                  key={item.label}
                  sx={{
                    background: 'transparent',
                    px: 1.25,
                    py: 0.95,
                    textAlign: 'center',
                    ...(index === 0
                      ? null
                      : {
                          borderLeft: '1px solid',
                          borderLeftColor: dividerColor,
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
                      {item.label === 'Time' ? (
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
            </Box>
            <Button
              autoFocus
              variant="contained"
              startIcon={isReviewComplete ? <Award size={15} /> : undefined}
              onClick={onNextRound}
              sx={[
                flatActionButtonSx,
                {
                  alignSelf: 'center',
                  backgroundColor: 'primary.main',
                  backgroundImage: 'none',
                },
              ]}
            >
              {isReviewComplete ? 'Finish' : 'Next'}
            </Button>
          </>
        ) : gameState.status === 'playing' ? (
          <>
            <Typography variant="h6">
              {isCapitalMode
                ? 'Guess the capital city.'
                : 'Guess the highlighted country.'}
            </Typography>
            <GuessInput
              options={countryOptions}
              variant={isCapitalMode ? 'capital' : 'country'}
              onSubmit={onSubmit}
            />
          </>
        ) : (
          <>
            <Typography variant="body1">Choose a run to begin.</Typography>
            {storedDailyResult ? (
              <Typography color="text.secondary" variant="body2">
                Daily complete: {storedDailyResult.correctCount}/
                {storedDailyResult.totalCount}
              </Typography>
            ) : (
              <Typography color="text.secondary" variant="body2">
                Open the menu for today&apos;s daily.
              </Typography>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}
