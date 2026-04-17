import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { Globe } from '@/components/Globe';
import { GlobeAdminPanel } from '@/components/GlobeAdminPanel';
import { GameBackground } from '@/components/GameBackground';
import type { CipherTrafficState } from '@/hooks/useCipherTraffic';
import { cipherTrafficStateAtom } from '@/game/state/game-atoms';
import { getThemeLabel } from '@/utils/themeTranslations';
import { useGlobeSceneState } from './useGlobeSceneState';

export function GlobeVertical() {
  const state = useGlobeSceneState();
  const setCipherTrafficState = useSetAtom(cipherTrafficStateAtom);
  const onCipherTrafficStateChange = useCallback(
    (nextState: CipherTrafficState) => {
      setCipherTrafficState(nextState);
    },
    [setCipherTrafficState],
  );

  if (!state.currentCountry || !state.worldData) {
    return null;
  }

  return (
    <>
      <GameBackground atlasStyleEnabled={state.atlasStyleEnabled} />
      <div className="h-full">
        <Globe
          country={state.currentCountry}
          focusRequest={state.focusRequest}
          height={state.viewport.visualHeight}
          mode={state.currentMode}
          palette={state.effectiveThemeSettings.globe}
          quality={state.effectiveThemeSettings.quality}
          render={state.effectiveThemeSettings.render}
          rotation={state.rotation}
          roundIndex={state.gameState.roundIndex}
          themeId={state.activeTheme.id}
          width={state.viewport.width}
          world={state.worldData.world}
          onCipherTrafficStateChange={onCipherTrafficStateChange}
        />
      </div>
      {state.adminEnabled ? (
        <GlobeAdminPanel
          key={`${state.activeTheme.id}:${state.resetRevision}`}
          defaultSettings={{
            globe: state.activeTheme.globe,
            quality: state.activeTheme.qualityDefaults,
            render: state.activeTheme.render,
          }}
          settings={state.effectiveThemeSettings}
          setSettingsPatch={state.setAdminOverridePatch}
          themeLabel={getThemeLabel(state.activeTheme.id)}
          onReset={state.resetAdminOverride}
        />
      ) : null}
    </>
  );
}
