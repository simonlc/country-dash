import NiceModal from '@ebay/nice-modal-react';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useI18n } from '@/app/i18n';
import { useAppearance } from '@/app/appearance';
import { m } from '@/paraglide/messages.js';
import {
  getThemeDisplaySurfaceStyles,
  getThemeSurfaceStyles,
  type AppThemeDefinition,
  type GlobeThemeSettings,
} from '@/app/theme';
import { AboutDialog } from '@/components/AboutDialog';
import { IntroDialog } from '@/components/IntroDialog';
import type { CipherTrafficState } from '@/hooks/useCipherTraffic';
import { useDailyShare } from '@/hooks/useDailyShare';
import { useGlobeAdminTuning } from '@/hooks/useGlobeAdminTuning';
import { useWindowSize } from '@/hooks/useWindowSize';
import type { GlobeThemeSettingsPatch } from '@/utils/globeQualityControls';
import { loadWorldData } from '@/utils/loadWorldData';
import { getCountryDisplayName } from '@/utils/countryNames';
import {
  buildRegionCountryPool,
  buildSessionPlan,
  createInitialGameState,
  createRandomSeed,
  createSessionConfig,
  formatDailyStorageKey,
  gameReducer,
  getInitialRotation,
  getRandomRunCountryCount,
  getTodayDateKey,
  randomRunPresetDifficulties,
} from '@/utils/gameLogic';
import {
  getModeLabel,
  getCountrySizeLabel,
  getRegionLabel,
  getSessionTypeLabel,
  regionFilters,
} from '@/utils/labelTranslations';
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

  if (gameState.sessionConfig.kind === 'daily') {
    return `${m.pool_global()}`;
  }

  if (gameState.regionFilter) {
    return getRegionLabel(gameState.regionFilter);
  }

  return getCountrySizeLabel(gameState.countrySizeFilter);
}

function getSessionModeLabel(gameState: GameState) {
  if (!gameState.sessionConfig) {
    return `${m.session_mode_none()}`;
  }

  return getModeLabel(gameState.sessionConfig.mode);
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
    return `${m.cipher_status_link_error()}`;
  }
  if (trafficState.status === 'loading') {
    return `${m.cipher_status_syncing()}`;
  }
  if (trafficState.source === 'cache') {
    return `${m.cipher_status_cached()}`;
  }
  if (trafficState.status === 'live') {
    return `${m.cipher_status_live()}`;
  }
  return `${m.cipher_status_offline()}`;
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
  currentCountryName: string | null;
  currentCountry: WorldData['world']['features'][number] | null;
  currentMode: GameMode;
  dailyShareText: string | null;
  displayAccentSurface: ReturnType<typeof getThemeDisplaySurfaceStyles>;
  displayElapsedMs: number;
  displaySurface: ReturnType<typeof getThemeDisplaySurfaceStyles>;
  effectiveThemeSettings: GlobeThemeSettings;
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
  atlasStyleEnabled: boolean;
  isCapitalMode: boolean;
  cipherThemeEnabled: boolean;
  isDailyRun: boolean;
  isKeyboardOpen: boolean;
  isLoading: boolean;
  isReviewComplete: boolean;
  keyboardInset: number;
  loadingError: string | null;
  locale: string;
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
    patch: GlobeThemeSettingsPatch,
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
  const { locale } = useI18n();
  const { activeTheme } = useAppearance();
  const atlasStyleEnabled = activeTheme.render.atlasStyleEnabled;
  const cipherThemeEnabled =
    activeTheme.render.cipherCountryTransitionOpacity > 0 ||
    activeTheme.render.cipherHydroOverlayOpacity > 0 ||
    activeTheme.render.cipherMapAnnotationsOpacity > 0 ||
    activeTheme.render.cipherSelectedCountryOverlayOpacity > 0 ||
    activeTheme.render.cipherTrafficOverlayOpacity > 0 ||
    activeTheme.render.cipherScreenTransitionOverlayOpacity > 0;
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
  const defaultThemeSettings = useMemo(
    () => ({
      globe: activeTheme.globe,
      quality: activeTheme.qualityDefaults,
      render: activeTheme.render,
    }),
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
    effectiveSettings,
    resetAdminOverride,
    resetRevision,
    setAdminOverridePatch,
  } = useGlobeAdminTuning({
    defaults: defaultThemeSettings,
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
  const categoryCounts = useMemo(
    () =>
      regionFilters.reduce(
        (counts, regionFilter) => {
          counts[regionFilter] = buildRegionCountryPool(
            countryPool,
            regionFilter,
          ).length;
          return counts;
        },
        {} as Record<RegionFilter, number>,
      ),
    [countryPool],
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
  const currentCountryName = useMemo(
    () => (currentCountry ? getCountryDisplayName(currentCountry.properties, locale) : null),
    [currentCountry, locale],
  );
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
    locale,
    storedDailyResult,
    todayDateKey,
    totalRounds,
  });

  const cipherSystemLines = useMemo(
    () => {
      void locale;

      return [
        `${m.cipher_system_status_label()} // ${getCipherTrafficStatusLabel(cipherTrafficState).toUpperCase()}`,
        `${m.cipher_system_tracks_label()} // ${cipherTrafficState.tracks.length.toString().padStart(2, '0')}`,
        `${m.cipher_system_sync_label()} // ${
          cipherTrafficState.updatedAtMs
            ? m.cipher_system_sync_locked()
            : m.cipher_system_sync_waiting()
        }`,
        `${m.cipher_system_cache_label()} // ${
          cipherTrafficState.cacheAgeMs !== null
            ? `${Math.round(cipherTrafficState.cacheAgeMs / 1000)}S`
            : m.cipher_system_cache_bypass()
        }`,
        `${m.cipher_system_source_label()} // ${cipherTrafficState.source.toUpperCase()}`,
        `${m.cipher_system_filter_label()} // ${m.cipher_system_priority_airspace()}`,
      ];
    },
    [cipherTrafficState, locale],
  );
  const sessionModeLabel = getSessionModeLabel(gameState);
  const sessionSummaryLabel = getSessionSummaryLabel(gameState);
  const cipherTickerText = useMemo(
    () => {
      void locale;

      return [
        m.cipher_ticker_node(),
        m.cipher_ticker_protocol(),
        `${m.cipher_ticker_round_prefix()} ${(gameState.roundIndex + 1).toString().padStart(2, '0')}/${Math.max(totalRounds, 1).toString().padStart(2, '0')}`,
        `${m.cipher_ticker_mode_prefix()} ${sessionModeLabel.toUpperCase()}`,
        `${m.cipher_ticker_airspace_prefix()} ${getCipherTrafficStatusLabel(cipherTrafficState).toUpperCase()}`,
        `${m.cipher_ticker_date_prefix()} ${todayDateKey}`,
      ].join(' // ');
    },
    [cipherTrafficState, gameState.roundIndex, locale, sessionModeLabel, todayDateKey, totalRounds],
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
      categoryCounts,
      counts: sizeCounts,
      dailyResult: storedDailyResult,
      onStartDaily: startDailyGame,
      onStartRandom: startRandomGame,
    });
  }, [
    categoryCounts,
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
      ? `${m.game_round_ready()}`
      : `${m.game_round({
          current: gameState.roundIndex + 1,
          total: totalRounds,
        })}`;

  const sessionLabels = [
    `${m.session_label_type({
      value: getSessionTypeLabel(gameState.sessionConfig?.kind ?? null),
    })}`,
    `${m.session_label_mode({ value: sessionModeLabel })}`,
    sessionSummaryLabel
      ? `${m.session_label_pool({ value: sessionSummaryLabel })}`
      : null,
  ].filter((value): value is string => Boolean(value));

  return {
    activeTheme,
    adminEnabled,
    cipherTelemetry: cipherThemeEnabled
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
    currentCountryName,
    currentCountry,
    currentMode: gameState.sessionConfig?.mode ?? gameState.mode,
    dailyShareText,
    displayAccentSurface,
    displayElapsedMs,
    displaySurface,
    effectiveThemeSettings: effectiveSettings,
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
    atlasStyleEnabled,
    isCapitalMode,
    cipherThemeEnabled,
    isDailyRun,
    isKeyboardOpen: size.isKeyboardOpen,
    isLoading: !worldData || !currentCountry,
    isReviewComplete,
    keyboardInset: size.isKeyboardOpen ? size.keyboardInset : 0,
    loadingError,
    locale,
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
