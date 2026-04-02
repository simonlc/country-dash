import { Leva, button, useControls } from 'leva';
import { useCallback, useEffect, useRef } from 'react';
import type { GlobeQualityConfig } from '@/app/theme';
import {
  buildGlobeQualityControlSchema,
  createGlobeQualityPatch,
} from '@/utils/globeQualityControls';

interface GlobeAdminPanelProps {
  defaultQuality: GlobeQualityConfig;
  quality: GlobeQualityConfig;
  setQualityPatch: (patch: Partial<GlobeQualityConfig>) => void;
  themeLabel: string;
  onReset: () => void;
}

export function GlobeAdminPanel({
  defaultQuality,
  quality,
  setQualityPatch,
  themeLabel,
  onReset,
}: GlobeAdminPanelProps) {
  const suppressPatchRef = useRef(false);
  const suppressFrameRef = useRef<number | null>(null);
  const schedulePatchResume = useCallback(() => {
    if (suppressFrameRef.current !== null) {
      window.cancelAnimationFrame(suppressFrameRef.current);
    }
    suppressFrameRef.current = window.requestAnimationFrame(() => {
      suppressPatchRef.current = false;
      suppressFrameRef.current = null;
    });
  }, []);
  const globeQualityControls = useControls(
    `${themeLabel} Globe Quality`,
    () => buildGlobeQualityControlSchema(quality),
    [quality, themeLabel],
  );
  const controls = globeQualityControls[0] as GlobeQualityConfig;
  const setControls = globeQualityControls[1] as (
    values: Partial<GlobeQualityConfig>,
  ) => void;

  useControls(
    `${themeLabel} Globe Quality`,
    {
      reset: button(() => {
        suppressPatchRef.current = true;
        setControls(defaultQuality);
        onReset();
        schedulePatchResume();
      }),
    },
    [defaultQuality, onReset, schedulePatchResume, setControls, themeLabel],
  );

  useEffect(() => {
    suppressPatchRef.current = true;
    setControls(quality);
    schedulePatchResume();
  }, [quality, schedulePatchResume, setControls]);

  useEffect(() => {
    return () => {
      if (suppressFrameRef.current !== null) {
        window.cancelAnimationFrame(suppressFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (suppressPatchRef.current) {
      return;
    }

    const patch = createGlobeQualityPatch(controls, quality);

    if (Object.keys(patch).length > 0) {
      setQualityPatch(patch);
    }
  }, [controls, quality, setQualityPatch]);

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
