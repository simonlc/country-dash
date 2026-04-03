import NiceModal from '@ebay/nice-modal-react';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useAppearance } from '@/app/appearance';
import {
  getThemeDisplaySurfaceStyles,
  getThemeSurfaceStyles,
  type AppThemeDefinition,
} from '@/app/theme';
import { AboutDialog } from '@/components/AboutDialog';
import { IntroDialog } from '@/components/IntroDialog';
import type { CipherTrafficState } from '@/hooks/useCipherTraffic';
import { useDailyShare } from '@/hooks/useDailyShare';
import { useGlobeAdminTuning } from '@/hooks/useGlobeAdminTuning';
import { useWindowSize } from '@/hooks/useWindowSize';
import { loadWorldData } from '@/utils/loadWorldData';
import {
  buildSessionPlan,
  countrySizeLabels,
  createInitialGameState,
  createRandomSeed,
  createSessionConfig,
  formatDailyStorageKey,
  gameReducer,
  getInitialRotation,
  getRandomRunCountryCount,
  getTodayDateKey,
  randomRunPresetDifficulties,
  regionLabels,
} from '@/utils/gameLogic';
import type {
  CountrySizeFilter,
  CountryProperties,
  DailyChallengeResult,
  Difficulty,
  GameMode,
  GameState,
  RegionFilter,
  SessionConfig,
  WorldData,
} from '@/types/game';

const dailyDifficulty: Difficulty = 'medium';

const modeLabels: Record<GameMode, string> = {
  classic: 'Classic',
  threeLives: '3 Lives',
  capitals: 'Capitals',
  streak: 'Streak',
};

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

  if (gameState.regionFilter) {
    return regionLabels[gameState.regionFilter];
  }

  return countrySizeLabels[gameState.countrySizeFilter];
}

function getSessionTypeLabel(gameState: GameState) {
  if (!gameState.sessionConfig) {
    return 'Menu';
  }

  return gameState.sessionConfig.kind === 'daily'
    ? 'Daily Challenge'
    : 'Random Run';
}

function getSessionModeLabel(gameState: GameState) {
  if (!gameState.sessionConfig) {
    return 'No mode selected';
  }

  return modeLabels[gameState.sessionConfig.mode];
}

const emptyCipherTrafficState: CipherTrafficState = {
  cacheAgeMs: null,
  errorMessage: null,
  source: 'disabled',
  status: 'disabled',
  tracks: [],
  updatedAtMs: null,
};

function getCipherTrafficStatusLabel(trafficState: CipherTrafficState) {
  if (trafficState.status === 'error') {
    return 'Traffic Link Error';
  }
  if (trafficState.status === 'loading') {
    return 'Traffic Syncing';
  }
  if (trafficState.source === 'cache') {
    return 'Traffic Cached';
  }
  if (trafficState.status === 'live') {
    return 'Traffic Live';
  }
  return 'Traffic Offline';
}

function getCipherTrafficStatusColor(trafficState: CipherTrafficState) {
  if (trafficState.status === 'error') {
    return 'rgba(255, 169, 150, 0.98)';
  }
  if (trafficState.source === 'cache') {
    return 'rgba(248, 255, 182, 0.98)';
  }
  if (trafficState.status === 'live') {
    return 'rgba(149, 255, 239, 0.98)';
  }
  return 'rgba(182, 212, 206, 0.96)';
}

interface UseGamePageStateResult {
  activeTheme: AppThemeDefinition;
  adminEnabled: boolean;
  cipherTelemetry: {
    errorMessage: string | null;
    statusColor: string;
    statusLabel: string;
    systemLines: string[];
    tickerText: string;
  } | null;
  copyState: 'idle' | 'copied' | 'failed';
  countryOptions: CountryProperties[];
  currentCountry: WorldData['world']['features'][number] | null;
  currentMode: GameMode;
  dailyShareText: string | null;
  displayAccentSurface: ReturnType<typeof getThemeDisplaySurfaceStyles>;
  displayElapsedMs: number;
  displaySurface: ReturnType<typeof getThemeDisplaySurfaceStyles>;
  effectiveQuality: AppThemeDefinition['qualityDefaults'];
  focusRequest: number;
  gameState: GameState;
  handlers: {
    onCipherTrafficStateChange: (state: CipherTrafficState) => void;
    onCopyDailyShare: () => Promise<void>;
    onNextRound: () => void;
    onPlayAgain: () => void;
    onRefocus: () => void;
    onReturnToMenu: () => void;
    onSubmit: (term: string) => void;
    openAbout: () => void;
  };
  isAtlas: boolean;
  isCapitalMode: boolean;
  isCipher: boolean;
  isDailyRun: boolean;
  isLoading: boolean;
  isReviewComplete: boolean;
  loadingError: string | null;
  panelSurface: ReturnType<typeof getThemeSurfaceStyles>;
  resetAdminOverride: () => void;
  resetRevision: number;
  rotation: [number, number];
  roundLabel: string;
  runningSince: number | null;
  sessionLabels: string[];
  sessionModeLabel: string;
  sessionSummaryLabel: string;
  setAdminOverridePatch: (
    patch: Partial<AppThemeDefinition['qualityDefaults']>,
  ) => void;
  showRefocus: boolean;
  size: {
    width: number;
    height: number;
  };
  storedDailyResult: DailyChallengeResult | null;
  totalRounds: number;
  worldData: WorldData | null;
}

export function useGamePageState(): UseGamePageStateResult {
  const size = useWindowSize();
  const { activeTheme } = useAppearance();
  const isAtlas = activeTheme.id === 'atlas';
  const isCipher = activeTheme.id === 'cipher';
  const panelSurface = useMemo(
    () => getThemeSurfaceStyles(activeTheme, 'elevated'),
    [activeTheme],
  );
  const displaySurface = useMemo(
    () => getThemeDisplaySurfaceStyles(activeTheme),
    [activeTheme],
  );
  const displayAccentSurface = useMemo(
    () => getThemeDisplaySurfaceStyles(activeTheme, 'accent'),
    [activeTheme],
  );
  const todayDateKey = useMemo(() => getTodayDateKey(), []);
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [gameState, dispatch] = useReducer(
    gameReducer,
    undefined,
    createInitialGameState,
  );
  const [storedDailyResult, setStoredDailyResult] =
    useState<DailyChallengeResult | null>(() =>
      getStoredDailyResult(todayDateKey),
    );
  const [focusRequest, setFocusRequest] = useState(0);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );
  const [cipherTrafficState, setCipherTrafficState] =
    useState<CipherTrafficState>(emptyCipherTrafficState);
  const {
    adminEnabled,
    effectiveQuality,
    resetAdminOverride,
    resetRevision,
    setAdminOverridePatch,
  } = useGlobeAdminTuning({
    defaults: activeTheme.qualityDefaults,
    themeId: activeTheme.id,
  });

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
        : null) ??
      countryPool[0] ??
      null,
    [countryFeaturesById, countryPool, gameState.currentCountryId],
  );
  const isCapitalMode = gameState.sessionConfig?.mode === 'capitals';
  const rotation = useMemo<[number, number]>(() => {
    if (!currentCountry) {
      return [0, 0];
    }
    if (
      isCapitalMode &&
      typeof currentCountry.properties.capitalLongitude === 'number' &&
      typeof currentCountry.properties.capitalLatitude === 'number'
    ) {
      return [
        -currentCountry.properties.capitalLongitude,
        -currentCountry.properties.capitalLatitude,
      ];
    }
    return getInitialRotation(currentCountry);
  }, [currentCountry, isCapitalMode]);
  const countryOptions = useMemo(
    () =>
      worldData?.world.features.map((feature) => feature.properties) ??
      ([] as CountryProperties[]),
    [worldData],
  );
  const totalRounds = gameState.sessionPlan?.totalRounds ?? 0;
  const displayElapsedMs = gameState.totalElapsedMs;
  const runningSince =
    gameState.status === 'playing' ? gameState.currentRoundStartedAt : null;
  const isDailyRun = gameState.sessionConfig?.kind === 'daily';
  const { dailyShareText } = useDailyShare({
    gameState,
    isDailyRun,
    storedDailyResult,
    todayDateKey,
    totalRounds,
  });

  const cipherSystemLines = useMemo(
    () => [
      `STATUS // ${getCipherTrafficStatusLabel(cipherTrafficState).toUpperCase()}`,
      `TRACKS // ${cipherTrafficState.tracks.length.toString().padStart(2, '0')}`,
      `SYNC // ${cipherTrafficState.updatedAtMs ? 'LOCKED' : 'WAITING'}`,
      `CACHE // ${cipherTrafficState.cacheAgeMs !== null ? `${Math.round(cipherTrafficState.cacheAgeMs / 1000)}S` : 'BYPASS'}`,
      `SOURCE // ${cipherTrafficState.source.toUpperCase()}`,
      `FILTER // PRIORITY AIRSPACE`,
    ],
    [cipherTrafficState],
  );
  const sessionModeLabel = getSessionModeLabel(gameState);
  const sessionSummaryLabel = getSessionSummaryLabel(gameState);
  const cipherTickerText = useMemo(
    () =>
      [
        'CIPHER CARTOGRAPHIC NODE',
        'VISUAL GEOLOCATION PROTOCOL',
        `ROUND ${(gameState.roundIndex + 1).toString().padStart(2, '0')}/${Math.max(totalRounds, 1).toString().padStart(2, '0')}`,
        `MODE ${sessionModeLabel.toUpperCase()}`,
        `AIRSPACE ${getCipherTrafficStatusLabel(cipherTrafficState).toUpperCase()}`,
        `DATE ${todayDateKey}`,
      ].join(' // '),
    [cipherTrafficState, gameState.roundIndex, sessionModeLabel, todayDateKey, totalRounds],
  );
  const handleCipherTrafficStateChange = useCallback(
    (nextState: CipherTrafficState) => {
      setCipherTrafficState(nextState);
    },
    [],
  );
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

    let cancelled = false;
    window.localStorage.setItem(
      formatDailyStorageKey(gameState.dailyResult.date),
      JSON.stringify(gameState.dailyResult),
    );
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setStoredDailyResult(gameState.dailyResult);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
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
    gameState.status,
    sizeCounts,
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

  const handleReturnToMenu = useCallback(() => {
    dispatch({ type: 'RETURN_TO_MENU' });
  }, []);

  const handleCopyDailyShare = useCallback(async () => {
    if (
      !dailyShareText ||
      typeof navigator === 'undefined' ||
      !navigator.clipboard
    ) {
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

  const openAbout = useCallback(() => {
    void NiceModal.show(AboutDialog);
  }, []);

  const roundLabel =
    gameState.status === 'intro'
      ? 'Ready'
      : `Round ${gameState.roundIndex + 1}/${totalRounds}`;

  const sessionLabels = [
    `Type: ${getSessionTypeLabel(gameState)}`,
    `Mode: ${sessionModeLabel}`,
    sessionSummaryLabel ? `Pool: ${sessionSummaryLabel}` : null,
  ].filter((value): value is string => Boolean(value));

  return {
    activeTheme,
    adminEnabled,
    cipherTelemetry: isCipher
      ? {
          errorMessage: cipherTrafficState.errorMessage,
          statusColor: getCipherTrafficStatusColor(cipherTrafficState),
          statusLabel: getCipherTrafficStatusLabel(cipherTrafficState),
          systemLines: cipherSystemLines,
          tickerText: cipherTickerText,
        }
      : null,
    copyState,
    countryOptions,
    currentCountry,
    currentMode: gameState.sessionConfig?.mode ?? gameState.mode,
    dailyShareText,
    displayAccentSurface,
    displayElapsedMs,
    displaySurface,
    effectiveQuality,
    focusRequest,
    gameState,
    handlers: {
      onCipherTrafficStateChange: handleCipherTrafficStateChange,
      onCopyDailyShare: handleCopyDailyShare,
      onNextRound: handleNextRound,
      onPlayAgain: handlePlayAgain,
      onRefocus: handleRefocus,
      onReturnToMenu: handleReturnToMenu,
      onSubmit: handleSubmit,
      openAbout,
    },
    isAtlas,
    isCapitalMode,
    isCipher,
    isDailyRun,
    isLoading: !worldData || !currentCountry,
    isReviewComplete,
    loadingError,
    panelSurface,
    resetAdminOverride,
    resetRevision,
    rotation,
    roundLabel,
    runningSince,
    sessionLabels,
    sessionModeLabel,
    sessionSummaryLabel,
    setAdminOverridePatch,
    showRefocus:
      gameState.status !== 'gameOver' && gameState.status !== 'intro',
    size,
    storedDailyResult,
    totalRounds,
    worldData,
  };
}
