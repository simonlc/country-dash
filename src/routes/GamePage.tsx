import NiceModal from '@ebay/nice-modal-react';
import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { FloatingOverlayLayer } from '@/components/FloatingOverlayLayer';
import { GameHud } from '@/components/GameHud';
import { IntroDialog } from '@/components/IntroDialog';
import { GuessPanel } from '@/components/guess/GuessPanel';
import { RoundStatusScreen } from '@/game/round-status/RoundStatusScreen';
import { GlobeVertical } from '@/game/globe/GlobeVertical';
import { CipherTelemetryLayer } from '@/game/globe/CipherTelemetryLayer';
import { useWindowSize } from '@/hooks/useWindowSize';
import {
  loadWorldDataAtom,
  startDailyGameAtom,
  startRandomGameAtom,
  syncStoredDailyResultAtom,
} from '@/game/state/game-actions';
import {
  gameStateAtom,
  loadingErrorAtom,
  storedDailyResultAtom,
  viewportStateAtom,
  worldDataAtom,
} from '@/game/state/game-atoms';
import {
  categoryCountsAtom,
  currentCountryAtom,
  isKeyboardOpenAtom,
  sizeCountsAtom,
} from '@/game/state/game-derived-atoms';
import { m } from '@/paraglide/messages.js';
import type { CountrySizeFilter, GameMode, RegionFilter } from '@/types/game';

export function GamePage() {
  const size = useWindowSize();
  const setViewportState = useSetAtom(viewportStateAtom);
  const loadWorldData = useSetAtom(loadWorldDataAtom);
  const syncStoredDailyResult = useSetAtom(syncStoredDailyResultAtom);
  const startDailyGame = useSetAtom(startDailyGameAtom);
  const startRandomGame = useSetAtom(startRandomGameAtom);
  const gameState = useAtomValue(gameStateAtom);
  const isKeyboardOpen = useAtomValue(isKeyboardOpenAtom);
  const loadingError = useAtomValue(loadingErrorAtom);
  const worldData = useAtomValue(worldDataAtom);
  const currentCountry = useAtomValue(currentCountryAtom);
  const sizeCounts = useAtomValue(sizeCountsAtom);
  const categoryCounts = useAtomValue(categoryCountsAtom);
  const storedDailyResult = useAtomValue(storedDailyResultAtom);
  const isPlaying = gameState.status === 'playing';

  useEffect(() => {
    setViewportState({
      height: size.height,
      isKeyboardOpen: size.isKeyboardOpen,
      visualHeight: size.visualHeight,
      width: size.width,
    });
  }, [
    setViewportState,
    size.height,
    size.isKeyboardOpen,
    size.visualHeight,
    size.width,
  ]);

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

  const topHudLayer = (
    <FloatingOverlayLayer align="start" maxWidth="hud">
      <GameHud />
    </FloatingOverlayLayer>
  );
  const bottomPanelLayer = (
    <FloatingOverlayLayer
      align="end"
      keyboardInset={isKeyboardOpen}
      maxWidth="status"
    >
      {isPlaying ? (
        <div className="md:mb-42">
          <GuessPanel />
        </div>
      ) : (
        <RoundStatusScreen />
      )}
    </FloatingOverlayLayer>
  );

  useEffect(() => {
    const lockWindowScroll = () => {
      if (window.scrollX !== 0 || window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    const viewport = window.visualViewport;
    lockWindowScroll();
    window.addEventListener('scroll', lockWindowScroll);
    viewport?.addEventListener('scroll', lockWindowScroll);

    return () => {
      window.removeEventListener('scroll', lockWindowScroll);
      viewport?.removeEventListener('scroll', lockWindowScroll);
    };
  }, []);

  if (loadingError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div
          role="alert"
          className="rounded-sm border border-[rgba(213,75,65,0.45)] bg-[rgba(213,75,65,0.14)] px-4 py-3"
        >
          {m.error_loading_country_data({ details: loadingError })}
        </div>
      </div>
    );
  }

  if (!worldData || !currentCountry) {
    return (
      <div
        aria-busy="true"
        aria-live="polite"
        role="status"
        className="grid min-h-screen place-items-center"
      >
        <svg
          aria-label={m.game_loading_country_data()}
          className="h-8 w-8 animate-spin text-[var(--color-primary)]"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="3"
          />
          <path
            d="M22 12a10 10 0 0 1-10 10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="fixed left-[var(--visual-viewport-offset-left,0px)] top-[var(--visual-viewport-offset-top,0px)] h-[var(--layout-height,100svh)] min-h-[100svh] w-[var(--layout-width,100vw)] overflow-hidden bg-[image:var(--app-background)]">
      <GlobeVertical />
      <CipherTelemetryLayer />
      <div className="pointer-events-none absolute inset-0 z-[1]">
        {topHudLayer}
        {bottomPanelLayer}
      </div>
    </div>
  );
}
