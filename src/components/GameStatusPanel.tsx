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
import { m } from '@/paraglide/messages.js';
import type {
  getThemeDisplaySurfaceStyles,
  getThemeSurfaceStyles,
} from '@/app/theme';
import { GuessInput } from '@/components/GuessInput';
import { formatElapsed } from '@/utils/gameLogic';
import { getLocalizedGeographyLabel } from '@/utils/geographyLabels';
import type { CountryProperties, GameState } from '@/types/game';

interface GameStatusPanelProps {
  copyState: 'idle' | 'copied' | 'failed';
  countryOptions: CountryProperties[];
  currentCountryName: string | null;
  dailyShareText: string | null;
  displaySurface: ReturnType<typeof getThemeDisplaySurfaceStyles>;
  gameState: GameState;
  isCapitalMode: boolean;
  isDailyRun: boolean;
  isKeyboardOpen: boolean;
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
  currentCountryName,
  dailyShareText,
  displaySurface,
  gameState,
  isCapitalMode,
  isDailyRun,
  isKeyboardOpen,
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
      ? (gameState.lastRound.capitalName ??
        currentCountryName ??
        gameState.lastRound.countryName)
      : (currentCountryName ?? gameState.lastRound.countryName)
    : '';
  const reviewMetadata = gameState.lastRound
    ? [
        isCapitalMode
          ? (currentCountryName ?? gameState.lastRound.countryName)
          : null,
        getLocalizedGeographyLabel(gameState.lastRound.continent),
        getLocalizedGeographyLabel(gameState.lastRound.subregion),
      ]
        .filter((value): value is string => Boolean(value))
        .join(' • ')
    : '';
  const playerGuess = gameState.lastRound?.playerGuess.trim() || m.game_no_answer();
  const showPlayerGuess =
    gameState.lastRound?.answerResult === 'incorrect' ||
    playerGuess === m.game_no_answer();
  const reviewStats = gameState.lastRound
    ? [
        {
          label: m.game_stat_time(),
          value: formatElapsed(gameState.lastRound.roundElapsedMs),
        },
        {
          label: m.game_stat_score(),
          value: `${gameState.lastRound.scoreDelta >= 0 ? '+' : ''}${
            gameState.lastRound.scoreDelta
          }`,
        },
      ]
    : [];
  const gameOverSummary = isDailyRun
    ? m.game_correct_today({ correct: gameState.correct, total: totalRounds })
    : m.game_correct({ correct: gameState.correct, total: totalRounds });
  const gameOverMeta = isDailyRun
    ? m.game_meta_daily({
        bestStreak: gameState.bestStreak,
        elapsed: formatElapsed(gameState.totalElapsedMs),
      })
    : m.game_meta_random({
        bestStreak: gameState.bestStreak,
        elapsed: formatElapsed(gameState.totalElapsedMs),
        score: gameState.score,
      });
  const isCorrect = gameState.lastRound?.answerResult === 'correct';
  const statusColor = isCorrect ? 'primary.main' : 'error.main';
  const dividerColor = (theme: Theme) =>
    theme.vars?.palette.divider ?? theme.palette.divider;

  const flatActionButtonSx = {
    borderRadius: designTokens.radius.sm,
    boxShadow: 'none',
    minWidth: { sm: 168, xs: 0 },
    px: { sm: 2.5, xs: 2 },
    textAlign: 'center',
    width: { xs: '100%', sm: 'auto' },
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
          borderRadius: {
            md: designTokens.radius.xs,
            xs: isKeyboardOpen ? designTokens.radius.sm : designTokens.radius.xs,
          },
          maxWidth: { md: 560, xs: isKeyboardOpen ? 'none' : 560 },
          mb: {
            md: isPlaying ? 16 : 4,
            xs: isKeyboardOpen ? 0 : isPlaying ? 8 : 2,
          },
          p: {
            md: designTokens.componentSpacing.overlayPanel.desktop,
            xs: isKeyboardOpen ? 1.4 : designTokens.componentSpacing.overlayPanel.mobile,
          },
          pointerEvents: 'auto',
          overflow: 'visible',
          textAlign: 'center',
          width: '100%',
        },
      ]}
    >
      <Stack spacing={isResultView ? 1.1 : isKeyboardOpen ? 1.1 : 2}>
        {gameState.status === 'gameOver' ? (
          <>
            <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  alignItems: 'center',
                  bgcolor: 'primary.main',
                  borderRadius: { sm: designTokens.radius.sm, xs: designTokens.radius.xs },
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
            {isDailyRun ? (
              <>
                {dailyShareText ? (
                  <>
                    <Paper
                      elevation={0}
                      sx={[
                        displaySurface,
                        {
                          borderRadius: { sm: designTokens.radius.md, xs: designTokens.radius.xs },
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
                        ? m.game_copied()
                        : copyState === 'failed'
                          ? m.game_copy_failed()
                          : m.action_copy_results()}
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
                  borderRadius: { sm: designTokens.radius.md, xs: designTokens.radius.xs },
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  width: '100%',
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
              sx={{ width: '100%' }}
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
                  {m.action_play_again()}
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
                {m.action_main_menu()}
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
                  borderRadius: { sm: designTokens.radius.sm, xs: designTokens.radius.xs },
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
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: dividerColor,
                  borderRadius: { sm: designTokens.radius.md, xs: designTokens.radius.xs },
                  px: { sm: 4, xs: 2 },
                  py: 1,
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                  <Typography color="text.secondary" variant="caption">
                    {m.game_your_guess()}
                  </Typography>
                <Typography variant="body1">{playerGuess}</Typography>
              </Box>
            ) : null}
            <Box
              sx={{
                border: '1px solid',
                borderColor: dividerColor,
                borderRadius: { sm: designTokens.radius.md, xs: designTokens.radius.xs },
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
               {isReviewComplete ? m.action_finish() : m.action_next()}
             </Button>
          </>
        ) : gameState.status === 'playing' ? (
          <>
            <Typography variant={isKeyboardOpen ? 'subtitle2' : 'h6'}>
              {isCapitalMode
                ? m.game_guess_capital_prompt()
                : m.game_guess_country_prompt()}
            </Typography>
            <GuessInput
              options={countryOptions}
              variant={isCapitalMode ? 'capital' : 'country'}
              onSubmit={onSubmit}
            />
          </>
        ) : (
          <>
            <Typography variant="body1">{m.game_choose_run()}</Typography>
            {storedDailyResult ? (
              <Typography color="text.secondary" variant="body2">
                {m.game_daily_complete_short({
                  correct: storedDailyResult.correctCount,
                  total: storedDailyResult.totalCount,
                })}
              </Typography>
            ) : (
              <Typography color="text.secondary" variant="body2">
                {m.game_open_menu_daily()}
              </Typography>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}
