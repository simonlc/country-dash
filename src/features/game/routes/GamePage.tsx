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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppearance } from '@/app/appearance';
import { Globe } from '@/Globe';
import { loadWorldData } from '@/features/game/data/loadWorldData';
import {
  buildCountriesByDifficulty,
  buildCountryPool,
  createInitialGameState,
  getInitialRotation,
  isCorrectGuess,
  nextRoundIndex,
} from '@/features/game/logic/gameLogic';
import { useWindowSize } from '@/features/game/hooks/useWindowSize';
import { GuessInput } from '@/features/game/ui/GuessInput';
import { IntroDialog } from '@/features/game/ui/IntroDialog';
import { GameTimer } from '@/features/game/ui/GameTimer';
import { AboutDialog } from '@/features/game/ui/AboutDialog';
import { ThemeMenu } from '@/features/game/ui/ThemeMenu';
import type {
  AnswerResult,
  CountryProperties,
  Difficulty,
  GameState,
  GlobeRenderer,
  WorldData,
} from '@/features/game/types';

const rendererStorageKey = 'country-guesser-renderer';

function getStoredRenderer(): GlobeRenderer {
  if (typeof window === 'undefined') {
    return 'svg';
  }

  const storage = window.localStorage;
  const storedValue =
    storage && typeof storage.getItem === 'function'
      ? storage.getItem(rendererStorageKey)
      : null;
  return storedValue === 'webgl' ? 'webgl' : 'svg';
}

export function GamePage() {
  const size = useWindowSize();
  const { activeTheme } = useAppearance();
  const isAtlas = activeTheme.id === 'atlas';
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [sessionKey, setSessionKey] = useState(0);
  const [focusRequest, setFocusRequest] = useState(0);
  const [renderer, setRenderer] = useState<GlobeRenderer>(getStoredRenderer);

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

  const countryPool = useMemo(
    () => (worldData ? buildCountryPool(worldData.world) : []),
    [worldData],
  );
  const countriesByDifficulty = useMemo(
    () => buildCountriesByDifficulty(countryPool),
    [countryPool],
  );

  const currentCountries = countriesByDifficulty[gameState.difficulty];
  const currentCountry = currentCountries[gameState.roundIndex] ?? null;
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

  const difficultyCounts = useMemo(
    () => ({
      easy: countriesByDifficulty.easy.length,
      medium: countriesByDifficulty.medium.length,
      hard: countriesByDifficulty.hard.length,
      veryHard: countriesByDifficulty.veryHard.length,
    }),
    [countriesByDifficulty],
  );

  const startGame = useCallback(
    (difficulty: Difficulty) => {
      const startingCountry = countriesByDifficulty[difficulty][0];
      if (!startingCountry) {
        return;
      }

      setGameState({
        ...createInitialGameState(difficulty),
        status: 'playing',
      });
      setSessionKey((value) => value + 1);
    },
    [countriesByDifficulty],
  );

  useEffect(() => {
    if (!worldData || gameState.status !== 'intro') {
      return;
    }

    void NiceModal.show(IntroDialog, {
      counts: difficultyCounts,
      onStart: startGame,
    });
  }, [difficultyCounts, gameState.status, startGame, worldData]);

  const handleSubmit = useCallback(
    (term: string) => {
      if (!currentCountry) {
        return;
      }

      const answerResult: AnswerResult = isCorrectGuess(
        term,
        currentCountry.properties.nameEn,
      )
        ? 'correct'
        : 'incorrect';

      setGameState((previousState) => ({
        ...previousState,
        correct:
          previousState.correct + (answerResult === 'correct' ? 1 : 0),
        incorrect:
          previousState.incorrect + (answerResult === 'incorrect' ? 1 : 0),
        streak: answerResult === 'correct' ? previousState.streak + 1 : 0,
        status: 'answered',
        answerResult,
      }));
    },
    [currentCountry],
  );

  const handleNextRound = useCallback(() => {
    const nextIndex = nextRoundIndex(
      gameState.roundIndex,
      currentCountries.length,
    );

    if (nextIndex === null) {
      setGameState((previousState) => ({
        ...previousState,
        status: 'gameOver',
        answerResult: null,
      }));
      return;
    }

    setGameState((previousState) => ({
      ...previousState,
      roundIndex: nextIndex,
      status: 'playing',
      answerResult: null,
    }));
  }, [currentCountries.length, gameState.roundIndex]);

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
        onRendererChange={setRenderer}
        onRefocus={() => setFocusRequest((value) => value + 1)}
        renderer={renderer}
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
          spacing={2}
        >
          <Paper
            elevation={0}
            sx={{
              backgroundColor: activeTheme.background.panel,
              border: `1px solid ${activeTheme.background.panelBorder}`,
              boxShadow: activeTheme.background.panelShadow,
              borderRadius: isAtlas ? '8px 12px 10px 9px' : undefined,
              overflow: isAtlas ? 'hidden' : undefined,
              p: 2,
              pointerEvents: 'auto',
              position: 'relative',
              '&::after': isAtlas
                ? {
                    background:
                      'linear-gradient(90deg, transparent, rgba(116, 74, 31, 0.12), transparent)',
                    content: '""',
                    height: 1,
                    left: 18,
                    opacity: 0.8,
                    position: 'absolute',
                    right: 18,
                    top: 14,
                    borderRadius: 'inherit',
                  }
                : undefined,
            }}
          >
            <Stack spacing={1}>
              <Typography variant="body2">
                Round {gameState.roundIndex + 1}/{currentCountries.length}
              </Typography>
              <Typography variant="h3">Country Guesser</Typography>
              <GameTimer
                key={sessionKey}
                isRunning={gameState.status === 'playing'}
              />
            </Stack>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              backgroundColor: activeTheme.background.panel,
              border: `1px solid ${activeTheme.background.panelBorder}`,
              boxShadow: activeTheme.background.panelShadow,
              borderRadius: isAtlas ? '11px 8px 12px 9px' : undefined,
              overflow: isAtlas ? 'hidden' : undefined,
              p: 2,
              pointerEvents: 'auto',
              position: 'relative',
              '&::before': isAtlas
                ? {
                    background:
                      'radial-gradient(circle, rgba(122, 74, 29, 0.12) 0, rgba(122, 74, 29, 0) 70%)',
                    content: '""',
                    height: 84,
                    opacity: 0.75,
                    position: 'absolute',
                    right: -18,
                    top: -20,
                    width: 84,
                    borderRadius: '50%',
                  }
                : undefined,
            }}
          >
            <Stack spacing={1} textAlign={{ md: 'right', xs: 'left' }}>
              <Typography variant="body2">Streak: {gameState.streak}</Typography>
              <Typography variant="body2">
                Correct: {gameState.correct}
              </Typography>
              <Typography variant="body2">
                Incorrect: {gameState.incorrect}
              </Typography>
              {gameState.status !== 'gameOver' ? (
                <Button
                  size="small"
                  sx={{ alignSelf: { md: 'flex-end', xs: 'stretch' } }}
                  variant="outlined"
                  onClick={() => setFocusRequest((value) => value + 1)}
                >
                  Refocus country
                </Button>
              ) : null}
            </Stack>
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
              backgroundColor: activeTheme.background.mutedPanel,
              border: `1px solid ${activeTheme.background.panelBorder}`,
              boxShadow: activeTheme.background.panelShadow,
              borderRadius: isAtlas ? '10px 14px 11px 8px' : undefined,
              maxWidth: 420,
              overflow: isAtlas ? 'hidden' : undefined,
              p: 3,
              pointerEvents: 'auto',
              position: 'relative',
              textAlign: 'center',
              width: '100%',
              alignSelf: 'end',
              mb: { md: 4, xs: 2 },
              '&::before': isAtlas
                ? {
                    background:
                      'radial-gradient(circle at top left, rgba(255,249,232,0.66), rgba(255,249,232,0) 56%)',
                    content: '""',
                    inset: 0,
                    pointerEvents: 'none',
                    position: 'absolute',
                    borderRadius: 'inherit',
                  }
                : undefined,
            }}
          >
            <Stack spacing={2}>
              {gameState.status === 'gameOver' ? (
                <>
                  <Typography variant="h4">Game over</Typography>
                  <Typography>
                    Final score: {gameState.correct} correct, {gameState.incorrect}{' '}
                    incorrect.
                  </Typography>
                  <Button variant="contained" onClick={() => startGame(gameState.difficulty)}>
                    Play again
                  </Button>
                </>
              ) : gameState.status === 'answered' ? (
                <>
                  <Alert severity={gameState.answerResult === 'correct' ? 'success' : 'error'}>
                    {gameState.answerResult === 'correct'
                      ? 'Correct'
                      : 'Incorrect'}
                  </Alert>
                  <Typography variant="h4">
                    {currentCountry.properties.nameEn}
                  </Typography>
                  <Button autoFocus variant="contained" onClick={handleNextRound}>
                    Next
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="body1">
                    Guess the highlighted country.
                  </Typography>
                  <GuessInput options={countryOptions} onSubmit={handleSubmit} />
                </>
              )}
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
