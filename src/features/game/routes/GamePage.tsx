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
      <Box sx={{ height: '100%' }}>
        <Globe
          country={currentCountry}
          focusRequest={focusRequest}
          height={size.height}
          palette={activeTheme.globe}
          renderer={renderer}
          rotation={rotation}
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
              p: 2,
              pointerEvents: 'auto',
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
              p: 2,
              pointerEvents: 'auto',
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
              maxWidth: 420,
              p: 3,
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
