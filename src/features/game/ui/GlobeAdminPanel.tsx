import { Leva, button, useControls } from 'leva';
import { useEffect } from 'react';
import type { GlobeQualityConfig } from '@/app/theme';

interface GlobeAdminPanelProps {
  quality: GlobeQualityConfig;
  setQualityPatch: (patch: Partial<GlobeQualityConfig>) => void;
  themeLabel: string;
  onReset: () => void;
}

export function GlobeAdminPanel({
  quality,
  setQualityPatch,
  themeLabel,
  onReset,
}: GlobeAdminPanelProps) {
  const [controls, setControls] = useControls(
    `${themeLabel} Globe Quality`,
    () => ({
      reliefMapEnabled: {
        value: quality.reliefMapEnabled,
      },
      reliefHeight: {
        max: 3,
        min: 0,
        step: 0.05,
        value: quality.reliefHeight,
      },
      dayImageryEnabled: {
        value: quality.dayImageryEnabled,
      },
      nightImageryEnabled: {
        value: quality.nightImageryEnabled,
      },
      cityLightsEnabled: {
        value: quality.cityLightsEnabled,
      },
      cityLightsIntensity: {
        max: 4,
        min: 0,
        step: 0.05,
        value: quality.cityLightsIntensity,
      },
      cityLightsThreshold: {
        max: 0.95,
        min: 0,
        step: 0.01,
        value: quality.cityLightsThreshold,
      },
      cityLightsGlow: {
        max: 4,
        min: 0,
        step: 0.05,
        value: quality.cityLightsGlow,
      },
      cityLightsColor: {
        value: quality.cityLightsColor,
      },
      lightPollutionEnabled: {
        value: quality.lightPollutionEnabled,
      },
      lightPollutionIntensity: {
        max: 4,
        min: 0,
        step: 0.05,
        value: quality.lightPollutionIntensity,
      },
      lightPollutionSpread: {
        max: 6,
        min: 0.25,
        step: 0.05,
        value: quality.lightPollutionSpread,
      },
      lightPollutionColor: {
        value: quality.lightPollutionColor,
      },
      waterMaskEnabled: {
        value: quality.waterMaskEnabled,
      },
      showLakes: {
        value: quality.showLakes,
      },
      showRivers: {
        value: quality.showRivers,
      },
      lakesOpacity: {
        max: 1,
        min: 0,
        step: 0.01,
        value: quality.lakesOpacity,
      },
      riversOpacity: {
        max: 1,
        min: 0,
        step: 0.01,
        value: quality.riversOpacity,
      },
      riversWidth: {
        max: 5,
        min: 0.1,
        step: 0.05,
        value: quality.riversWidth,
      },
      lakesColor: {
        value: quality.lakesColor,
      },
      riversColor: {
        value: quality.riversColor,
      },
      umbraDarkness: {
        max: 1,
        min: 0,
        step: 0.05,
        value: quality.umbraDarkness,
      },
      reset: button(() => {
        onReset();
      }),
    }),
    [
      quality.dayImageryEnabled,
      quality.cityLightsEnabled,
      quality.cityLightsIntensity,
      quality.cityLightsThreshold,
      quality.cityLightsGlow,
      quality.cityLightsColor,
      quality.lightPollutionEnabled,
      quality.lightPollutionIntensity,
      quality.lightPollutionSpread,
      quality.lightPollutionColor,
      quality.nightImageryEnabled,
      quality.reliefHeight,
      quality.reliefMapEnabled,
      quality.waterMaskEnabled,
      quality.showLakes,
      quality.showRivers,
      quality.lakesOpacity,
      quality.riversOpacity,
      quality.riversWidth,
      quality.lakesColor,
      quality.riversColor,
      quality.umbraDarkness,
      themeLabel,
    ],
  );

  useEffect(() => {
    setControls({
      cityLightsColor: quality.cityLightsColor,
      cityLightsEnabled: quality.cityLightsEnabled,
      cityLightsGlow: quality.cityLightsGlow,
      cityLightsIntensity: quality.cityLightsIntensity,
      cityLightsThreshold: quality.cityLightsThreshold,
      dayImageryEnabled: quality.dayImageryEnabled,
      lakesColor: quality.lakesColor,
      lakesOpacity: quality.lakesOpacity,
      lightPollutionColor: quality.lightPollutionColor,
      lightPollutionEnabled: quality.lightPollutionEnabled,
      lightPollutionIntensity: quality.lightPollutionIntensity,
      lightPollutionSpread: quality.lightPollutionSpread,
      nightImageryEnabled: quality.nightImageryEnabled,
      reliefHeight: quality.reliefHeight,
      reliefMapEnabled: quality.reliefMapEnabled,
      riversColor: quality.riversColor,
      riversOpacity: quality.riversOpacity,
      riversWidth: quality.riversWidth,
      showLakes: quality.showLakes,
      showRivers: quality.showRivers,
      umbraDarkness: quality.umbraDarkness,
      waterMaskEnabled: quality.waterMaskEnabled,
    });
  }, [
    quality.cityLightsColor,
    quality.cityLightsEnabled,
    quality.cityLightsGlow,
    quality.cityLightsIntensity,
    quality.cityLightsThreshold,
    quality.dayImageryEnabled,
    quality.lakesColor,
    quality.lakesOpacity,
    quality.lightPollutionColor,
    quality.lightPollutionEnabled,
    quality.lightPollutionIntensity,
    quality.lightPollutionSpread,
    quality.nightImageryEnabled,
    quality.reliefHeight,
    quality.reliefMapEnabled,
    quality.riversColor,
    quality.riversOpacity,
    quality.riversWidth,
    quality.showLakes,
    quality.showRivers,
    quality.umbraDarkness,
    quality.waterMaskEnabled,
    setControls,
  ]);

  useEffect(() => {
    const patch: Partial<GlobeQualityConfig> = {};

    if (controls.reliefMapEnabled !== quality.reliefMapEnabled) {
      patch.reliefMapEnabled = controls.reliefMapEnabled;
    }
    if (controls.reliefHeight !== quality.reliefHeight) {
      patch.reliefHeight = controls.reliefHeight;
    }
    if (controls.dayImageryEnabled !== quality.dayImageryEnabled) {
      patch.dayImageryEnabled = controls.dayImageryEnabled;
    }
    if (controls.nightImageryEnabled !== quality.nightImageryEnabled) {
      patch.nightImageryEnabled = controls.nightImageryEnabled;
    }
    if (controls.cityLightsEnabled !== quality.cityLightsEnabled) {
      patch.cityLightsEnabled = controls.cityLightsEnabled;
    }
    if (controls.cityLightsIntensity !== quality.cityLightsIntensity) {
      patch.cityLightsIntensity = controls.cityLightsIntensity;
    }
    if (controls.cityLightsThreshold !== quality.cityLightsThreshold) {
      patch.cityLightsThreshold = controls.cityLightsThreshold;
    }
    if (controls.cityLightsGlow !== quality.cityLightsGlow) {
      patch.cityLightsGlow = controls.cityLightsGlow;
    }
    if (controls.cityLightsColor !== quality.cityLightsColor) {
      patch.cityLightsColor = controls.cityLightsColor;
    }
    if (
      controls.lightPollutionEnabled !== quality.lightPollutionEnabled
    ) {
      patch.lightPollutionEnabled = controls.lightPollutionEnabled;
    }
    if (
      controls.lightPollutionIntensity !== quality.lightPollutionIntensity
    ) {
      patch.lightPollutionIntensity = controls.lightPollutionIntensity;
    }
    if (
      controls.lightPollutionSpread !== quality.lightPollutionSpread
    ) {
      patch.lightPollutionSpread = controls.lightPollutionSpread;
    }
    if (controls.lightPollutionColor !== quality.lightPollutionColor) {
      patch.lightPollutionColor = controls.lightPollutionColor;
    }
    if (controls.waterMaskEnabled !== quality.waterMaskEnabled) {
      patch.waterMaskEnabled = controls.waterMaskEnabled;
    }
    if (controls.showLakes !== quality.showLakes) {
      patch.showLakes = controls.showLakes;
    }
    if (controls.showRivers !== quality.showRivers) {
      patch.showRivers = controls.showRivers;
    }
    if (controls.lakesOpacity !== quality.lakesOpacity) {
      patch.lakesOpacity = controls.lakesOpacity;
    }
    if (controls.riversOpacity !== quality.riversOpacity) {
      patch.riversOpacity = controls.riversOpacity;
    }
    if (controls.riversWidth !== quality.riversWidth) {
      patch.riversWidth = controls.riversWidth;
    }
    if (controls.lakesColor !== quality.lakesColor) {
      patch.lakesColor = controls.lakesColor;
    }
    if (controls.riversColor !== quality.riversColor) {
      patch.riversColor = controls.riversColor;
    }
    if (controls.umbraDarkness !== quality.umbraDarkness) {
      patch.umbraDarkness = controls.umbraDarkness;
    }

    if (Object.keys(patch).length > 0) {
      setQualityPatch(patch);
    }
  }, [
    controls.dayImageryEnabled,
    controls.cityLightsEnabled,
    controls.cityLightsIntensity,
    controls.cityLightsThreshold,
    controls.cityLightsGlow,
    controls.cityLightsColor,
    controls.lightPollutionEnabled,
    controls.lightPollutionIntensity,
    controls.lightPollutionSpread,
    controls.lightPollutionColor,
    controls.nightImageryEnabled,
    controls.reliefHeight,
    controls.reliefMapEnabled,
    controls.waterMaskEnabled,
    controls.showLakes,
    controls.showRivers,
    controls.lakesOpacity,
    controls.riversOpacity,
    controls.riversWidth,
    controls.lakesColor,
    controls.riversColor,
    controls.umbraDarkness,
    quality.dayImageryEnabled,
    quality.cityLightsEnabled,
    quality.cityLightsIntensity,
    quality.cityLightsThreshold,
    quality.cityLightsGlow,
    quality.cityLightsColor,
    quality.lightPollutionEnabled,
    quality.lightPollutionIntensity,
    quality.lightPollutionSpread,
    quality.lightPollutionColor,
    quality.nightImageryEnabled,
    quality.reliefHeight,
    quality.reliefMapEnabled,
    quality.waterMaskEnabled,
    quality.showLakes,
    quality.showRivers,
    quality.lakesOpacity,
    quality.riversOpacity,
    quality.riversWidth,
    quality.lakesColor,
    quality.riversColor,
    quality.umbraDarkness,
    setQualityPatch,
  ]);

  return (
    <>
      <style>
        {`
          #leva__root {
            position: fixed !important;
            top: 12px !important;
            right: 12px !important;
            z-index: 4000 !important;
          }
        `}
      </style>
      <Leva
        collapsed={false}
        hideCopyButton
      />
    </>
  );
}
