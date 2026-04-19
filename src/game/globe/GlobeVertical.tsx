import { useCallback, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useAppearance } from '@/app/appearance';
import { Globe } from '@/components/Globe';
import { GlobeAdminPanel } from '@/components/GlobeAdminPanel';
import type { CipherTrafficState } from '@/hooks/useCipherTraffic';
import { useGlobeAdminTuning } from '@/hooks/useGlobeAdminTuning';
import {
  cipherTrafficStateAtom,
  focusRequestAtom,
  worldDataAtom,
} from '@/game/state/game-atoms';
import {
  currentCountryAtom,
  gameModeAtom,
  isCapitalModeAtom,
  roundIndexAtom,
  viewportTopInsetAtom,
  viewportVisualHeightAtom,
  viewportWidthAtom,
} from '@/game/state/game-derived-atoms';
import { getInitialRotation } from '@/utils/gameLogic';
import { getThemeLabel } from '@/utils/themeTranslations';

export function GlobeVertical() {
  const { activeTheme } = useAppearance();
  const viewportWidth = useAtomValue(viewportWidthAtom);
  const viewportTopInset = useAtomValue(viewportTopInsetAtom);
  const viewportVisualHeight = useAtomValue(viewportVisualHeightAtom);
  const worldData = useAtomValue(worldDataAtom);
  const focusRequest = useAtomValue(focusRequestAtom);
  const gameMode = useAtomValue(gameModeAtom);
  const roundIndex = useAtomValue(roundIndexAtom);
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
  const setCipherTrafficState = useSetAtom(cipherTrafficStateAtom);
  const onCipherTrafficStateChange = useCallback(
    (nextState: CipherTrafficState) => {
      setCipherTrafficState(nextState);
    },
    [setCipherTrafficState],
  );

  if (!currentCountry || !worldData) {
    return null;
  }

  return (
    <>
      <div
        className="w-full overflow-hidden"
        style={{
          height: `${viewportVisualHeight}px`,
          marginTop: `${viewportTopInset}px`,
        }}
      >
        <Globe
          country={currentCountry}
          focusRequest={focusRequest}
          height={viewportVisualHeight}
          mode={gameMode}
          palette={effectiveSettings.globe}
          quality={effectiveSettings.quality}
          render={effectiveSettings.render}
          rotation={rotation}
          roundIndex={roundIndex}
          themeId={activeTheme.id}
          width={viewportWidth}
          world={worldData.world}
          onCipherTrafficStateChange={onCipherTrafficStateChange}
        />
      </div>
      {adminEnabled ? (
        <GlobeAdminPanel
          key={`${activeTheme.id}:${resetRevision}`}
          defaultSettings={{
            globe: activeTheme.globe,
            quality: activeTheme.qualityDefaults,
            render: activeTheme.render,
          }}
          settings={effectiveSettings}
          setSettingsPatch={setAdminOverridePatch}
          themeLabel={getThemeLabel(activeTheme.id)}
          onReset={resetAdminOverride}
        />
      ) : null}
    </>
  );
}
