import { Leva, button, useControls } from 'leva';
import { useCallback, useEffect, useRef } from 'react';
import type {
  GlobePalette,
  GlobeQualityConfig,
  GlobeRenderConfig,
  GlobeThemeSettings,
} from '@/app/theme';
import {
  createGlobePalettePatch,
  createGlobeQualityPatch,
  createGlobeRenderPatch,
  hasThemeSettingsPatch,
  buildGlobePaletteControlSchema,
  buildGlobeQualityControlSchema,
  buildGlobeRenderControlSchema,
  type GlobeThemeSettingsPatch,
} from '@/utils/globeQualityControls';

interface GlobeAdminPanelProps {
  defaultSettings: GlobeThemeSettings;
  onReset: () => void;
  setSettingsPatch: (patch: GlobeThemeSettingsPatch) => void;
  settings: GlobeThemeSettings;
  themeLabel: string;
}

export function GlobeAdminPanel({
  defaultSettings,
  onReset,
  setSettingsPatch,
  settings,
  themeLabel,
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
  const globePaletteControls = useControls(
    `${themeLabel} Globe Palette`,
    () => buildGlobePaletteControlSchema(settings.globe),
    [settings.globe, themeLabel],
  );
  const globeQualityControls = useControls(
    `${themeLabel} Globe Quality`,
    () => buildGlobeQualityControlSchema(settings.quality),
    [settings.quality, themeLabel],
  );
  const globeRenderControls = useControls(
    `${themeLabel} Globe Render`,
    () => buildGlobeRenderControlSchema(settings.render),
    [settings.render, themeLabel],
  );

  const paletteControls = globePaletteControls[0] as GlobePalette;
  const setPaletteControls = globePaletteControls[1] as (
    values: Partial<GlobePalette>,
  ) => void;
  const qualityControls = globeQualityControls[0] as GlobeQualityConfig;
  const setQualityControls = globeQualityControls[1] as (
    values: Partial<GlobeQualityConfig>,
  ) => void;
  const renderControls = globeRenderControls[0] as GlobeRenderConfig;
  const setRenderControls = globeRenderControls[1] as (
    values: Partial<GlobeRenderConfig>,
  ) => void;

  useControls(
    `${themeLabel} Globe Theme`,
    {
      reset: button(() => {
        suppressPatchRef.current = true;
        setPaletteControls(defaultSettings.globe);
        setQualityControls(defaultSettings.quality);
        setRenderControls(defaultSettings.render);
        onReset();
        schedulePatchResume();
      }),
    },
    [
      defaultSettings.globe,
      defaultSettings.quality,
      defaultSettings.render,
      onReset,
      schedulePatchResume,
      setPaletteControls,
      setQualityControls,
      setRenderControls,
      themeLabel,
    ],
  );

  useEffect(() => {
    suppressPatchRef.current = true;
    setPaletteControls(settings.globe);
    setQualityControls(settings.quality);
    setRenderControls(settings.render);
    schedulePatchResume();
  }, [
    schedulePatchResume,
    setPaletteControls,
    setQualityControls,
    setRenderControls,
    settings.globe,
    settings.quality,
    settings.render,
  ]);

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

    const patch = {
      globe: createGlobePalettePatch(paletteControls, settings.globe),
      quality: createGlobeQualityPatch(qualityControls, settings.quality),
      render: createGlobeRenderPatch(renderControls, settings.render),
    } satisfies GlobeThemeSettingsPatch;

    if (hasThemeSettingsPatch(patch)) {
      setSettingsPatch(patch);
    }
  }, [
    paletteControls,
    qualityControls,
    renderControls,
    setSettingsPatch,
    settings.globe,
    settings.quality,
    settings.render,
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
