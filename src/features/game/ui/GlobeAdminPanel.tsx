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
  const controls = useControls(
    `${themeLabel} Globe Quality`,
    {
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
    },
    [
      quality.dayImageryEnabled,
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
