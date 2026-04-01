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
    controls.umbraDarkness,
    quality.dayImageryEnabled,
    quality.nightImageryEnabled,
    quality.reliefHeight,
    quality.reliefMapEnabled,
    quality.waterMaskEnabled,
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
