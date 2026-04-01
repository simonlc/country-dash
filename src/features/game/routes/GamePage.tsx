import NiceModal from '@ebay/nice-modal-react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useAppearance } from '@/app/appearance';
import {
  getThemeAccentSurfaceStyles,
  getThemeSurfaceStyles,
} from '@/app/theme';
import { Globe } from '@/Globe';
import { loadWorldData } from '@/features/game/data/loadWorldData';
import {
  buildDailyShareText,
  buildSessionPlan,
  countrySizeLabels,
  createInitialGameState,
  createRandomSeed,
  createSessionConfig,
  formatDailyStorageKey,
  formatElapsed,
  gameReducer,
  getRandomRunCountryCount,
  getInitialRotation,
  getTodayDateKey,
  randomRunPresetDifficulties,
  regionLabels,
} from '@/features/game/logic/gameLogic';
import { useWindowSize } from '@/features/game/hooks/useWindowSize';
import { GuessInput } from '@/features/game/ui/GuessInput';
import { IntroDialog } from '@/features/game/ui/IntroDialog';
import { GameTimer } from '@/features/game/ui/GameTimer';
import { AboutDialog } from '@/features/game/ui/AboutDialog';
import { ThemeMenu } from '@/features/game/ui/ThemeMenu';
import type {
  CountrySizeFilter,
  CountryProperties,
  DailyChallengeResult,
  Difficulty,
  GameMode,
  GameState,
  GlobeRenderer,
  RegionFilter,
  SessionConfig,
  WorldData,
} from '@/features/game/types';

const rendererStorageKey = 'country-guesser-renderer';
const dailyDifficulty: Difficulty = 'medium';

const modeLabels: Record<GameMode, string> = {
  classic: 'Classic',
  threeLives: '3 Lives',
  speedrun: 'Speedrun',
  streak: 'Streak',
};

function getStoredRenderer(): GlobeRenderer {
  return 'webgl';
}

function getStoredDailyResult(dateKey: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(formatDailyStorageKey(dateKey));
  if (!rawValue) {
    return null;
  }

  return JSON.parse(rawValue) as DailyChallengeResult;
}

function getSessionSummaryLabel(gameState: GameState) {
  if (!gameState.sessionConfig) {
    return '';
  }
  const parts = [];

  if (gameState.regionFilter) {
    parts.push(regionLabels[gameState.regionFilter]);
  } else {
    parts.push(countrySizeLabels[gameState.countrySizeFilter]);
  }

  return parts.join(' • ');
}

function getSessionTypeLabel(gameState: GameState) {
  if (!gameState.sessionConfig) {
    return 'Menu';
  }

  return gameState.sessionConfig.kind === 'daily' ? 'Daily Challenge' : 'Random Run';
}

function getSessionModeLabel(gameState: GameState) {
  if (!gameState.sessionConfig) {
    return 'No mode selected';
  }

  return modeLabels[gameState.sessionConfig.mode];
}

export function GamePage() {
  const size = useWindowSize();
  const { activeTheme } = useAppearance();
  const isAtlas = activeTheme.id === 'atlas';
  const panelSurface = useMemo(
    () => getThemeSurfaceStyles(activeTheme, 'elevated'),
    [activeTheme],
  );
  const mutedSurface = useMemo(
    () => getThemeSurfaceStyles(activeTheme, 'muted'),
    [activeTheme],
  );
  const accentSurface = useMemo(
    () => getThemeAccentSurfaceStyles(activeTheme),
    [activeTheme],
  );
  const todayDateKey = useMemo(() => getTodayDateKey(), []);
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [gameState, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  const [storedDailyResult, setStoredDailyResult] = useState<DailyChallengeResult | null>(
    () => getStoredDailyResult(todayDateKey),
  );
  const [focusRequest, setFocusRequest] = useState(0);
  const renderer = getStoredRenderer();
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    let cancelled = false;

    loadWorldData()
      .then((data) => {
        if (!cancelled) {
          setWorldData(data);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setLoadingError(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const storage = window.localStorage;
    if (storage && typeof storage.setItem === 'function') {
      storage.setItem(rendererStorageKey, renderer);
    }
  }, [renderer]);

  useEffect(() => {
    if (gameState.status !== 'playing') {
      return;
    }

    const intervalId = window.setInterval(() => {
      dispatch({
        type: 'TICK_TIMER',
        now: performance.now(),
      });
    }, 50);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [gameState.status]);

  const countryPool = useMemo(
    () => (worldData ? worldData.world.features : []),
    [worldData],
  );
  const countryFeaturesById = useMemo(
    () => new Map(countryPool.map((country) => [country.id, country] as const)),
    [countryPool],
  );
  const sizeCounts = useMemo(
    () => ({
      large: getRandomRunCountryCount(countryPool.length, 'large'),
      mixed: getRandomRunCountryCount(countryPool.length, 'mixed'),
      small: getRandomRunCountryCount(countryPool.length, 'small'),
    }),
    [countryPool.length],
  );
  const currentCountry = useMemo(
    () =>
      (gameState.currentCountryId
        ? countryFeaturesById.get(gameState.currentCountryId)
        : null) ?? countryPool[0] ?? null,
    [countryFeaturesById, countryPool, gameState.currentCountryId],
  );
  const rotation = useMemo<[number, number]>(() => {
    if (!currentCountry) {
      return [0, 0];
    }
    return getInitialRotation(currentCountry);
  }, [currentCountry]);
  const countryOptions = useMemo(
    () =>
      worldData?.world.features.map((feature) => feature.properties) ??
      ([] as CountryProperties[]),
    [worldData],
  );
  const totalRounds = gameState.sessionPlan?.totalRounds ?? 0;
  const displayElapsedMs =
    gameState.totalElapsedMs +
    (gameState.status === 'playing' ? gameState.currentRoundElapsedMs : 0);
  const isDailyRun = gameState.sessionConfig?.kind === 'daily';
  const completedDailyResult = useMemo(() => {
    if (gameState.dailyResult) {
      return gameState.dailyResult;
    }
    if (
      isDailyRun &&
      gameState.status === 'gameOver' &&
      gameState.rounds.length > 0
    ) {
      return {
        date: gameState.sessionConfig?.dateKey ?? todayDateKey,
        seed: gameState.sessionConfig?.seed ?? todayDateKey,
        completedAt: new Date().toISOString(),
        correctCount: gameState.correct,
        totalCount: gameState.rounds.length,
        rounds: gameState.rounds,
      };
    }
    return storedDailyResult;
  }, [
    gameState.correct,
    gameState.dailyResult,
    gameState.rounds,
    gameState.sessionConfig,
    gameState.status,
    isDailyRun,
    storedDailyResult,
    todayDateKey,
  ]);
  const dailyShareText = useMemo(() => {
    if (!isDailyRun || gameState.status !== 'gameOver') {
      return null;
    }
    if (completedDailyResult) {
      return buildDailyShareText(completedDailyResult);
    }

    const summary = [
      `🧭 Country Guesser Daily ${todayDateKey}`,
      `🌍 Score: ${gameState.correct}/${totalRounds}`,
    ].join('\n');
    const emojiLine = gameState.rounds
      .map((round) => (round.answerResult === 'correct' ? '🟢' : '⚫'))
      .join('');

    return emojiLine ? `${summary}\n${emojiLine}` : summary;
  }, [
    completedDailyResult,
    gameState.correct,
    gameState.rounds,
    gameState.status,
    isDailyRun,
    todayDateKey,
    totalRounds,
  ]);
  const isReviewComplete =
    gameState.status === 'reviewing' &&
    ((gameState.sessionConfig?.mode === 'streak' &&
      gameState.lastRound?.answerResult === 'incorrect') ||
      (gameState.sessionConfig?.mode === 'threeLives' &&
        (gameState.livesRemaining ?? 1) <= 0) ||
      gameState.roundIndex + 1 >= totalRounds);

  useEffect(() => {
    if (!gameState.dailyResult) {
      return;
    }

    window.localStorage.setItem(
      formatDailyStorageKey(gameState.dailyResult.date),
      JSON.stringify(gameState.dailyResult),
    );
    setStoredDailyResult(gameState.dailyResult);
  }, [gameState.dailyResult]);

  const beginSession = useCallback(
    (config: SessionConfig) => {
      if (!worldData) {
        return;
      }

      const plan = buildSessionPlan(worldData.world, config);
      dispatch({
        type: 'START_SESSION',
        config,
        plan,
        startedAt: performance.now(),
      });
      setFocusRequest((value) => value + 1);
    },
    [worldData],
  );

  const startRandomGame = useCallback(
    (options: {
      mode: GameMode;
      regionFilter: RegionFilter | null;
      countrySizeFilter: CountrySizeFilter;
    }) => {
      const config = createSessionConfig({
        difficulty: options.regionFilter
          ? 'medium'
          : randomRunPresetDifficulties[options.countrySizeFilter],
        kind: 'random',
        mode: options.mode,
        regionFilter: options.regionFilter,
        countrySizeFilter: options.countrySizeFilter,
        seed: createRandomSeed(),
      });

      beginSession(config);
    },
    [beginSession],
  );

  const startDailyGame = useCallback(() => {
    if (storedDailyResult) {
      return;
    }

    const config = createSessionConfig({
      dateKey: todayDateKey,
      difficulty: dailyDifficulty,
      kind: 'daily',
      mode: 'classic',
      seed: todayDateKey,
    });

    beginSession(config);
  }, [beginSession, storedDailyResult, todayDateKey]);

  useEffect(() => {
    if (!worldData || gameState.status !== 'intro') {
      return;
    }

    void NiceModal.show(IntroDialog, {
      counts: sizeCounts,
      dailyResult: storedDailyResult,
      onStartDaily: startDailyGame,
      onStartRandom: startRandomGame,
    });
  }, [
    sizeCounts,
    gameState.status,
    startDailyGame,
    startRandomGame,
    storedDailyResult,
    worldData,
  ]);

  const handleSubmit = useCallback(
    (term: string) => {
      if (!currentCountry || gameState.status !== 'playing') {
        return;
      }

      dispatch({
        type: 'SUBMIT_GUESS',
        country: currentCountry,
        guess: term,
        submittedAt: performance.now(),
      });
    },
    [currentCountry, gameState.status],
  );

  const handleNextRound = useCallback(() => {
    dispatch({
      type: 'ADVANCE_ROUND',
      startedAt: performance.now(),
    });
  }, []);

  const handleRefocus = useCallback(() => {
    if (gameState.status === 'playing') {
      dispatch({
        type: 'USE_HINT',
        hintType: 'refocus',
      });
    }
    setFocusRequest((value) => value + 1);
  }, [gameState.status]);

  const handlePlayAgain = useCallback(() => {
    const config = gameState.sessionConfig;

    if (!config) {
      return;
    }

    beginSession(
      createSessionConfig({
        difficulty: config.selectedDifficulty,
        kind: 'random',
        mode: config.mode,
        regionFilter: config.regionFilter,
        countrySizeFilter: config.countrySizeFilter,
        seed: createRandomSeed(),
      }),
    );
  }, [beginSession, gameState.sessionConfig]);

  const handleQuitToMenu = useCallback(() => {
    dispatch({ type: 'RETURN_TO_MENU' });
  }, []);

  const handleCopyDailyShare = useCallback(async () => {
    if (!dailyShareText || typeof navigator === 'undefined' || !navigator.clipboard) {
      setCopyState('failed');
      return;
    }

    try {
      await navigator.clipboard.writeText(dailyShareText);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }, [dailyShareText]);

  useEffect(() => {
    if (copyState === 'idle') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState('idle');
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  if (loadingError) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{loadingError}</Alert>
      </Container>
    );
  }

  if (!worldData || !currentCountry) {
    return (
      <Box
        sx={{
          alignItems: 'center',
          display: 'grid',
          minHeight: '100vh',
          placeItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundImage: activeTheme.background.app,
        height: '100dvh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {isAtlas ? (
        <>
          <Box
            sx={{
              background:
                'radial-gradient(circle at 18% 22%, rgba(120, 71, 28, 0.18) 0, rgba(120, 71, 28, 0.08) 7%, rgba(120, 71, 28, 0) 15%), radial-gradient(circle at 78% 72%, rgba(98, 58, 23, 0.12) 0, rgba(98, 58, 23, 0.05) 9%, rgba(98, 58, 23, 0) 19%), linear-gradient(180deg, rgba(255,245,220,0.12), rgba(73,43,18,0.2))',
              inset: 0,
              mixBlendMode: 'multiply',
              opacity: 0.42,
              pointerEvents: 'none',
              position: 'absolute',
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              backgroundImage:
                'linear-gradient(90deg, rgba(104, 67, 31, 0.05) 0, rgba(104, 67, 31, 0.05) 1px, transparent 1px), linear-gradient(rgba(104, 67, 31, 0.045) 0, rgba(104, 67, 31, 0.045) 1px, transparent 1px)',
              backgroundPosition: 'center',
              backgroundSize: '72px 72px',
              inset: 0,
              maskImage:
                'radial-gradient(circle at center, black 46%, transparent 86%)',
              opacity: 0.2,
              pointerEvents: 'none',
              position: 'absolute',
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              background:
                'linear-gradient(180deg, rgba(255, 247, 229, 0.18), rgba(98, 57, 17, 0.08))',
              boxShadow:
                'inset 0 0 0 2px rgba(92, 57, 24, 0.12), inset 0 0 120px rgba(87, 54, 20, 0.2)',
              inset: 12,
              pointerEvents: 'none',
              position: 'absolute',
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              backgroundImage:
                'linear-gradient(180deg, rgba(255,245,220,0.08) 0, rgba(255,245,220,0) 38%, rgba(49,29,11,0.1) 100%), linear-gradient(180deg, rgba(0,0,0,0.035) 0, rgba(0,0,0,0.02) 32%, rgba(255,244,211,0.02) 58%, rgba(0,0,0,0.05) 100%)',
              inset: 0,
              mixBlendMode: 'multiply',
              opacity: 0.14,
              pointerEvents: 'none',
              position: 'absolute',
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              background:
                'radial-gradient(circle at center, rgba(0,0,0,0) 54%, rgba(48,28,10,0.08) 78%, rgba(30,16,6,0.2) 100%)',
              inset: 0,
              opacity: 0.6,
              pointerEvents: 'none',
              position: 'absolute',
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              background:
                'linear-gradient(180deg, rgba(92, 56, 24, 0.24), rgba(42, 23, 8, 0.38))',
              boxShadow:
                'inset 0 0 0 1px rgba(178, 132, 75, 0.18), inset 0 0 0 10px rgba(28, 16, 7, 0.18)',
              inset: 0,
              maskImage:
                'radial-gradient(circle at 50% 50%, transparent 0 82%, rgba(0,0,0,0.7) 92%, black 100%)',
              opacity: 0.5,
              pointerEvents: 'none',
              position: 'absolute',
              zIndex: 2,
            }}
          />
          <Box
            sx={{
              background:
                'radial-gradient(circle at 8% 10%, rgba(245, 208, 145, 0.18) 0, rgba(245, 208, 145, 0) 12%), radial-gradient(circle at 92% 16%, rgba(244, 204, 133, 0.14) 0, rgba(244, 204, 133, 0) 10%), radial-gradient(circle at 10% 88%, rgba(70, 39, 12, 0.24) 0, rgba(70, 39, 12, 0) 10%), radial-gradient(circle at 92% 84%, rgba(70, 39, 12, 0.26) 0, rgba(70, 39, 12, 0) 10%)',
              inset: 0,
              mixBlendMode: 'screen',
              opacity: 0.24,
              pointerEvents: 'none',
              position: 'absolute',
              zIndex: 2,
            }}
          />
          <Box
            sx={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0) 0, rgba(255,244,211,0.018) 18%, rgba(255,255,255,0) 42%, rgba(0,0,0,0.028) 100%), repeating-linear-gradient(180deg, rgba(255,255,255,0) 0, rgba(255,255,255,0) 24px, rgba(255,244,211,0.024) 28px, rgba(255,255,255,0) 38px, rgba(0,0,0,0.018) 52px, rgba(255,255,255,0) 66px)',
              inset: 0,
              mixBlendMode: 'screen',
              maskImage:
                'radial-gradient(circle at center, transparent 0 58%, rgba(0,0,0,0.18) 74%, black 100%)',
              opacity: 0.1,
              pointerEvents: 'none',
              position: 'absolute',
              zIndex: 2,
            }}
          />
        </>
      ) : null}
      <Box sx={{ height: '100%' }}>
        <Globe
          country={currentCountry}
          focusRequest={focusRequest}
          height={size.height}
          palette={activeTheme.globe}
          renderer={renderer}
          rotation={rotation}
          themeId={activeTheme.id}
          width={size.width}
          world={worldData.world}
        />
      </Box>
      <ThemeMenu
        onAbout={() => {
          void NiceModal.show(AboutDialog);
        }}
        onQuit={handleQuitToMenu}
        onRefocus={handleRefocus}
        onRestart={handlePlayAgain}
      />
      <Container
        maxWidth="lg"
        sx={{
          inset: 0,
          position: 'absolute',
          py: { md: 3, xs: 2 },
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <Stack
          direction={{ md: 'row', xs: 'column' }}
          justifyContent="space-between"
          spacing={1.25}
        >
          <Paper
            elevation={0}
            sx={{
              ...panelSurface,
              borderRadius: isAtlas ? '6px 9px 7px 8px' : 3,
              flex: 1,
              p: { md: 1.3, xs: 1.1 },
              pointerEvents: 'auto',
            }}
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
              <Stack spacing={0.15} sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                <Typography
                  color="text.secondary"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  variant="caption"
                >
                  {gameState.status === 'intro'
                    ? 'Ready'
                    : `Round ${gameState.roundIndex + 1}/${totalRounds}`}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                  <Typography fontWeight={700} lineHeight={1} variant="h6">
                    {getSessionModeLabel(gameState)}
                  </Typography>
                  {getSessionSummaryLabel(gameState) ? (
                    <Typography color="text.secondary" lineHeight={1.3} variant="body2">
                      {getSessionSummaryLabel(gameState)}
                    </Typography>
                  ) : null}
                </Stack>
                <Stack direction="row" flexWrap="wrap" gap={0.6}>
                  {[
                    `Type: ${getSessionTypeLabel(gameState)}`,
                    `Mode: ${getSessionModeLabel(gameState)}`,
                    getSessionSummaryLabel(gameState)
                      ? `Pool: ${getSessionSummaryLabel(gameState)}`
                      : null,
                  ]
                    .filter((value): value is string => Boolean(value))
                    .map((label) => (
                      <Typography key={label} color="text.secondary" variant="caption">
                        {label}
                      </Typography>
                    ))}
                </Stack>
              </Stack>
              {[
                { label: 'Score', value: gameState.score },
                { label: 'Streak', value: gameState.streak },
                { label: 'Hit', value: gameState.correct },
                { label: 'Miss', value: gameState.incorrect },
                ...(gameState.livesRemaining !== null
                  ? [{ label: 'Lives', value: gameState.livesRemaining }]
                  : []),
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    ...mutedSurface,
                    borderRadius: 999,
                    minWidth: { md: 74, xs: 0 },
                    px: 1.2,
                    py: 0.85,
                    textAlign: 'center',
                  }}
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
                sx={{
                  ...accentSurface,
                  borderRadius: 999,
                  px: 1.2,
                  py: 0.85,
                  justifySelf: { md: 'end', xs: 'stretch' },
                  gridColumn: { xs: 'span 2', md: 'auto' },
                }}
              >
                <GameTimer elapsedMs={displayElapsedMs} />
              </Paper>
              {gameState.status !== 'gameOver' && gameState.status !== 'intro' ? (
                <Button
                  aria-label="Refocus country"
                  size="small"
                  sx={{
                    borderColor: 'rgba(150, 201, 255, 0.22)',
                    gridColumn: { xs: 'span 2', md: 'auto' },
                    py: 0.85,
                  }}
                  variant="contained"
                  onClick={handleRefocus}
                >
                  Refocus
                </Button>
              ) : null}
            </Box>
          </Paper>
        </Stack>

        <Box
          sx={{
            alignItems: 'center',
            display: 'grid',
            inset: 0,
            justifyItems: 'center',
            pointerEvents: 'none',
            position: 'absolute',
            px: 2,
            py: { md: 4, xs: 2 },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              ...panelSurface,
              borderRadius: isAtlas ? '8px 10px 8px 7px' : 3,
              maxWidth: 560,
              p: { md: 2.4, xs: 2 },
              pointerEvents: 'auto',
              textAlign: 'center',
              width: '100%',
              alignSelf: 'end',
              mb: { md: 4, xs: 2 },
            }}
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
                            sx={{
                              ...mutedSurface,
                              borderRadius: 3,
                              p: 1.5,
                            }}
                          >
                            <Typography
                              component="pre"
                              sx={{
                                fontFamily: 'inherit',
                                fontSize: '0.95rem',
                                m: 0,
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {dailyShareText}
                            </Typography>
                          </Paper>
                          <Button variant="outlined" onClick={handleCopyDailyShare}>
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
                      out of {totalRounds}.
                    </Typography>
                  )}
                  <Typography color="text.secondary" variant="body2">
                    Best streak: {gameState.bestStreak} • Total time:{' '}
                    {formatElapsed(gameState.totalElapsedMs)}
                  </Typography>
                  <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1}>
                    {!isDailyRun ? (
                      <Button variant="contained" onClick={handlePlayAgain}>
                        Play again
                      </Button>
                    ) : null}
                    <Button
                      variant={!isDailyRun ? 'outlined' : 'contained'}
                      onClick={() => dispatch({ type: 'RETURN_TO_MENU' })}
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
                      {gameState.lastRound.countryName}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {[
                        gameState.lastRound.continent,
                        gameState.lastRound.subregion,
                      ]
                        .filter((value): value is string => Boolean(value))
                        .join(' • ')}
                    </Typography>
                  </Stack>
                  <Paper
                    elevation={0}
                    sx={{
                      ...mutedSurface,
                      borderRadius: 3.5,
                      p: 1.5,
                      textAlign: 'left',
                    }}
                  >
                    <Stack spacing={0.6}>
                      <Typography color="text.secondary" variant="caption">
                        You guessed:{' '}
                        {gameState.lastRound.playerGuess.trim() || 'No answer'}
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
                        sx={{
                          ...accentSurface,
                          borderRadius: 3,
                          p: 1.1,
                        }}
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
                  <Button autoFocus variant="contained" onClick={handleNextRound}>
                    {isReviewComplete ? 'Finish' : 'Next'}
                  </Button>
                </>
              ) : gameState.status === 'playing' ? (
                <>
                  <Typography variant="h6">Guess the highlighted country.</Typography>
                  <GuessInput options={countryOptions} onSubmit={handleSubmit} />
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
        </Box>
      </Container>
    </Box>
  );
}
