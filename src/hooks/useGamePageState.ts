import NiceModal from '@ebay/nice-modal-react';
import { useEffect, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { m } from '@/paraglide/messages.js';
import { IntroDialog } from '@/components/IntroDialog';
import type { CipherTrafficState } from '@/hooks/useCipherTraffic';
import { useDailyShare } from '@/hooks/useDailyShare';
import { useGameGlobeState } from '@/game/hooks/useGameGlobeState';
import { useGameHudState } from '@/game/hooks/useGameHudState';
import { useGameSessionActions } from '@/game/hooks/useGameSessionActions';
import { useGameStatusState } from '@/game/hooks/useGameStatusState';
import {
  loadWorldDataAtom,
  startDailyGameAtom,
  startRandomGameAtom,
  syncStoredDailyResultAtom,
} from '@/game/state/game-actions';
import {
  categoryCountsAtom,
  sizeCountsAtom,
  totalRoundsAtom,
} from '@/game/state/game-derived-atoms';
import {
  cipherTrafficStateAtom,
  copyStateAtom,
  todayDateKeyAtom,
} from '@/game/state/game-atoms';
import type {
  CountrySizeFilter,
  CountryProperties,
  DailyChallengeResult,
  GameMode,
  GameState,
  RegionFilter,
  WorldData,
} from '@/types/game';
import type { GlobeThemeSettingsPatch } from '@/utils/globeQualityControls';

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
  activeTheme: ReturnType<typeof useGameGlobeState>['activeTheme'];
  adminEnabled: boolean;
  atlasStyleEnabled: boolean;
  cipherTelemetry: {
    errorMessage: string | null;
    statusColor: string;
    statusLabel: string;
    systemLines: string[];
    tickerText: string;
  } | null;
  cipherThemeEnabled: boolean;
  copyState: 'idle' | 'copied' | 'failed';
  countryOptions: CountryProperties[];
  currentCountryName: string | null;
  currentCountry: WorldData['world']['features'][number] | null;
  currentMode: GameMode;
  dailyShareText: string | null;
  displayElapsedMs: number;
  effectiveThemeSettings: ReturnType<
    typeof useGameGlobeState
  >['effectiveThemeSettings'];
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
  isCapitalMode: boolean;
  isDailyRun: boolean;
  isKeyboardOpen: boolean;
  isLoading: boolean;
  isReviewComplete: boolean;
  loadingError: string | null;
  locale: string;
  resetAdminOverride: () => void;
  resetRevision: number;
  rotation: [number, number];
  roundLabel: string;
  runningSince: number | null;
  sessionLabels: string[];
  sessionModeLabel: string;
  sessionSummaryLabel: string;
  setAdminOverridePatch: (patch: GlobeThemeSettingsPatch) => void;
  size: {
    width: number;
    height: number;
    visualHeight: number;
    isKeyboardOpen: boolean;
  };
  storedDailyResult: DailyChallengeResult | null;
  totalRounds: number;
  worldData: WorldData | null;
}

export function useGamePageState(): UseGamePageStateResult {
  const {
    activeTheme,
    adminEnabled,
    atlasStyleEnabled,
    cipherThemeEnabled,
    countryOptions,
    currentCountry,
    currentCountryName,
    effectiveThemeSettings,
    focusRequest,
    gameState,
    isCapitalMode,
    loadingError,
    locale,
    resetAdminOverride,
    resetRevision,
    rotation,
    setAdminOverridePatch,
    size,
    worldData,
  } = useGameGlobeState();
  const {
    gameState: statusGameState,
    isDailyRun,
    isReviewComplete,
    storedDailyResult,
  } = useGameStatusState();
  const {
    displayElapsedMs,
    roundLabel,
    runningSince,
    sessionLabels,
    sessionModeLabel,
    sessionSummaryLabel,
  } = useGameHudState();
  const copyState = useAtomValue(copyStateAtom);
  const setCopyState = useSetAtom(copyStateAtom);
  const cipherTrafficState = useAtomValue(cipherTrafficStateAtom);
  const todayDateKey = useAtomValue(todayDateKeyAtom);
  const sizeCounts = useAtomValue(sizeCountsAtom);
  const categoryCounts = useAtomValue(categoryCountsAtom);
  const totalRounds = useAtomValue(totalRoundsAtom);
  const syncStoredDailyResult = useSetAtom(syncStoredDailyResultAtom);
  const startDailyGame = useSetAtom(startDailyGameAtom);
  const startRandomGame = useSetAtom(startRandomGameAtom);
  const loadWorldData = useSetAtom(loadWorldDataAtom);
  const { dailyShareText } = useDailyShare({
    gameState: statusGameState,
    isDailyRun,
    locale,
    storedDailyResult,
    todayDateKey,
    totalRounds,
  });
  const handlers = useGameSessionActions({ dailyShareText });

  useEffect(() => {
    void loadWorldData();
  }, [loadWorldData]);

  useEffect(() => {
    if (!gameState.dailyResult) {
      return;
    }

    syncStoredDailyResult();
  }, [gameState.dailyResult, syncStoredDailyResult]);

  useEffect(() => {
    if (!worldData || gameState.status !== 'intro') {
      return;
    }

    void NiceModal.show(IntroDialog, {
      categoryCounts,
      counts: sizeCounts,
      dailyResult: storedDailyResult,
      onStartDaily: () => {
        startDailyGame();
      },
      onStartRandom: (options: {
        mode: GameMode;
        regionFilter: RegionFilter | null;
        countrySizeFilter: CountrySizeFilter;
      }) => {
        startRandomGame(options);
      },
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
  }, [copyState, setCopyState]);

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
    [
      cipherTrafficState,
      gameState.roundIndex,
      locale,
      sessionModeLabel,
      todayDateKey,
      totalRounds,
    ],
  );

  return {
    activeTheme,
    adminEnabled,
    atlasStyleEnabled,
    cipherTelemetry: cipherThemeEnabled
      ? {
          errorMessage: cipherTrafficState.errorMessage,
          statusColor: getCipherTrafficStatusColor(cipherTrafficState),
          statusLabel: getCipherTrafficStatusLabel(cipherTrafficState),
          systemLines: cipherSystemLines,
          tickerText: cipherTickerText,
        }
      : null,
    cipherThemeEnabled,
    copyState,
    countryOptions,
    currentCountryName,
    currentCountry,
    currentMode: gameState.sessionConfig?.mode ?? gameState.mode,
    dailyShareText,
    displayElapsedMs,
    effectiveThemeSettings,
    focusRequest,
    gameState,
    handlers,
    isCapitalMode,
    isDailyRun,
    isKeyboardOpen: size.isKeyboardOpen,
    isLoading: !worldData || !currentCountry,
    isReviewComplete,
    loadingError,
    locale,
    resetAdminOverride,
    resetRevision,
    rotation,
    roundLabel,
    runningSince,
    sessionLabels,
    sessionModeLabel,
    sessionSummaryLabel,
    setAdminOverridePatch,
    size,
    storedDailyResult,
    totalRounds,
    worldData,
  };
}
