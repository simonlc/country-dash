import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useAppearance } from '@/app/appearance';
import { useI18n } from '@/app/i18n';
import { useGlobeAdminTuning } from '@/hooks/useGlobeAdminTuning';
import { useWindowSize } from '@/hooks/useWindowSize';
import { gameStateAtom, focusRequestAtom, loadingErrorAtom, worldDataAtom } from '@/game/state/game-atoms';
import { countryOptionsAtom, currentCountryAtom, isCapitalModeAtom } from '@/game/state/game-derived-atoms';
import { getCountryDisplayName } from '@/utils/countryNames';
import { getInitialRotation } from '@/utils/gameLogic';

export function useGameGlobeState() {
  const size = useWindowSize();
  const { activeTheme } = useAppearance();
  const { locale } = useI18n();
  const worldData = useAtomValue(worldDataAtom);
  const loadingError = useAtomValue(loadingErrorAtom);
  const focusRequest = useAtomValue(focusRequestAtom);
  const gameState = useAtomValue(gameStateAtom);
  const currentCountry = useAtomValue(currentCountryAtom);
  const countryOptions = useAtomValue(countryOptionsAtom);
  const isCapitalMode = useAtomValue(isCapitalModeAtom);

  const atlasStyleEnabled = activeTheme.render.atlasStyleEnabled;
  const cipherThemeEnabled =
    activeTheme.render.cipherCountryTransitionOpacity > 0 ||
    activeTheme.render.cipherHydroOverlayOpacity > 0 ||
    activeTheme.render.cipherMapAnnotationsOpacity > 0 ||
    activeTheme.render.cipherSelectedCountryOverlayOpacity > 0 ||
    activeTheme.render.cipherTrafficOverlayOpacity > 0 ||
    activeTheme.render.cipherScreenTransitionOverlayOpacity > 0;
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
  const currentCountryName = useMemo(
    () =>
      currentCountry
        ? getCountryDisplayName(currentCountry.properties, locale)
        : null,
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

  return {
    activeTheme,
    adminEnabled,
    atlasStyleEnabled,
    cipherThemeEnabled,
    countryOptions,
    currentCountry,
    currentCountryName,
    effectiveThemeSettings: effectiveSettings,
    focusRequest,
    gameState,
    isCapitalMode,
    loadingError,
    locale,
    resetAdminOverride,
    resetRevision,
    rotation,
    setAdminOverridePatch,
    size: {
      height: size.height,
      isKeyboardOpen: size.isKeyboardOpen,
      visualHeight: size.visualHeight,
      width: size.width,
    },
    worldData,
  };
}
