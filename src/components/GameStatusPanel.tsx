import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { designTokens } from '@/app/designSystem';
import {
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
  displayAccentSurface: ReturnType<typeof getThemeDisplaySurfaceStyles>;
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
  displayAccentSurface,
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
  return (
    <Paper
      elevation={0}
      sx={[
        panelSurface,
        {
          alignSelf: 'end',
          borderRadius: designTokens.radius.md,
          maxWidth: 560,
          mb: { md: 4, xs: 2 },
          p: {
            md: designTokens.componentSpacing.overlayPanel.desktop,
            xs: designTokens.componentSpacing.overlayPanel.mobile,
          },
          pointerEvents: 'auto',
          textAlign: 'center',
          width: '100%',
        },
      ]}
    >
      <Stack spacing={2}>
        {gameState.status === 'gameOver' ? (
          <>
            <Typography variant="h4">
              {isDailyRun ? 'Daily complete' : 'Run complete'}
            </Typography>
            {isDailyRun ? (
              <>
                <Typography variant="body1">
                  Today&apos;s score: {gameState.correct}/{totalRounds}
                </Typography>
                {dailyShareText ? (
                  <>
                    <Paper
                      elevation={0}
                      sx={[
                        displaySurface,
                        {
                          borderRadius: designTokens.radius.md,
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
                      onClick={() => {
                        void onCopyDailyShare();
                      }}
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
            ) : (
              <Typography variant="body1">
                Final score: {gameState.score} with {gameState.correct} correct
                {' '}out of {totalRounds}.
              </Typography>
            )}
            <Typography color="text.secondary" variant="body2">
              Best streak: {gameState.bestStreak} • Total time:{' '}
              {formatElapsed(gameState.totalElapsedMs)}
            </Typography>
            <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1}>
              {!isDailyRun ? (
                <Button variant="contained" onClick={onPlayAgain}>
                  Play again
                </Button>
              ) : null}
              <Button
                variant={!isDailyRun ? 'outlined' : 'contained'}
                onClick={onReturnToMenu}
              >
                Main menu
              </Button>
            </Stack>
          </>
        ) : gameState.status === 'reviewing' && gameState.lastRound ? (
          <>
            <Alert
              severity={
                gameState.lastRound.answerResult === 'correct'
                  ? 'success'
                  : 'error'
              }
              sx={{ alignSelf: 'center', minWidth: 140 }}
              variant="standard"
            >
              {gameState.lastRound.answerResult === 'correct'
                ? 'Correct'
                : 'Incorrect'}
            </Alert>
            <Stack spacing={0.5}>
              <Typography variant="h4">
                {isCapitalMode
                  ? gameState.lastRound.capitalName ??
                    gameState.lastRound.countryName
                  : gameState.lastRound.countryName}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {[
                  isCapitalMode ? gameState.lastRound.countryName : null,
                  gameState.lastRound.continent,
                  gameState.lastRound.subregion,
                ]
                  .filter((value): value is string => Boolean(value))
                  .join(' • ')}
              </Typography>
            </Stack>
            <Paper
              elevation={0}
              sx={[
                displaySurface,
                {
                  borderRadius: designTokens.radius.md,
                  p: 1.5,
                  textAlign: 'left',
                },
              ]}
            >
              <Stack spacing={0.6}>
                <Typography color="text.secondary" variant="caption">
                  You guessed: {gameState.lastRound.playerGuess.trim() || 'No answer'}
                </Typography>
                <Typography variant="body1">
                  {gameState.lastRound.playerGuess.trim() || 'No answer'}
                </Typography>
              </Stack>
            </Paper>
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                width: '100%',
              }}
            >
              {[
                {
                  label: 'Time',
                  value: formatElapsed(gameState.lastRound.roundElapsedMs),
                },
                {
                  label: 'Score',
                  value: `+${gameState.lastRound.scoreDelta}`,
                },
                {
                  label: 'Hints',
                  value: gameState.lastRound.hintsUsed,
                },
              ].map((item) => (
                <Paper
                  key={item.label}
                  elevation={0}
                  sx={[
                    displayAccentSurface,
                    {
                      borderRadius: designTokens.radius.sm,
                      p: 1.1,
                    },
                  ]}
                >
                  <Typography color="text.secondary" variant="caption">
                    {item.label}
                  </Typography>
                  <Typography
                    sx={{ fontVariantNumeric: 'tabular-nums' }}
                    variant="subtitle1"
                  >
                    {item.value}
                  </Typography>
                </Paper>
              ))}
            </Box>
            {gameState.lastRound.hintsUsed > 0 ? (
              <Typography color="text.secondary" variant="caption">
                Hint penalty applied.
              </Typography>
            ) : null}
            <Button autoFocus variant="contained" onClick={onNextRound}>
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
