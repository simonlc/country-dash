import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useAppearance } from '@/app/appearance';
import { useGlobeAdminTuning } from '@/hooks/useGlobeAdminTuning';
import {
  focusRequestAtom,
  gameStateAtom,
  viewportStateAtom,
  worldDataAtom,
} from '@/game/state/game-atoms';
import {
  currentCountryAtom,
  isCapitalModeAtom,
} from '@/game/state/game-derived-atoms';
import { getInitialRotation } from '@/utils/gameLogic';

export function useGlobeSceneState() {
  const { activeTheme } = useAppearance();
  const viewport = useAtomValue(viewportStateAtom);
  const worldData = useAtomValue(worldDataAtom);
  const focusRequest = useAtomValue(focusRequestAtom);
  const gameState = useAtomValue(gameStateAtom);
  const currentCountry = useAtomValue(currentCountryAtom);
  const isCapitalMode = useAtomValue(isCapitalModeAtom);

  const defaultThemeSettings = useMemo(
    () => ({
      globe: activeTheme.globe,
      quality: activeTheme.qualityDefaults,
      render: activeTheme.render,
    }),
    [activeTheme],
  );
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
  const atlasStyleEnabled = activeTheme.render.atlasStyleEnabled;
  const cipherThemeEnabled =
    activeTheme.render.cipherCountryTransitionOpacity > 0 ||
    activeTheme.render.cipherHydroOverlayOpacity > 0 ||
    activeTheme.render.cipherMapAnnotationsOpacity > 0 ||
    activeTheme.render.cipherSelectedCountryOverlayOpacity > 0 ||
    activeTheme.render.cipherTrafficOverlayOpacity > 0 ||
    activeTheme.render.cipherScreenTransitionOverlayOpacity > 0;
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

  return {
    activeTheme,
    adminEnabled,
    atlasStyleEnabled,
    cipherThemeEnabled,
    currentCountry,
    currentMode: gameState.sessionConfig?.mode ?? gameState.mode,
    effectiveThemeSettings: effectiveSettings,
    focusRequest,
    gameState,
    resetAdminOverride,
    resetRevision,
    rotation,
    setAdminOverridePatch,
    viewport,
    worldData,
  };
}
