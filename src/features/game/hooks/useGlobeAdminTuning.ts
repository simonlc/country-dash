import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppThemeId, GlobeQualityConfig } from '@/app/theme';

interface UseGlobeAdminTuningArgs {
  defaults: GlobeQualityConfig;
  themeId: AppThemeId;
}

interface UseGlobeAdminTuningResult {
  adminEnabled: boolean;
  effectiveQuality: GlobeQualityConfig;
  resetAdminOverride: () => void;
  resetRevision: number;
  setAdminOverridePatch: (patch: Partial<GlobeQualityConfig>) => void;
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function getStorageKey(themeId: AppThemeId) {
  return `country-guesser-admin-quality:${themeId}`;
}

function sanitizeOverride(
  value: Partial<GlobeQualityConfig>,
): Partial<GlobeQualityConfig> {
  const next: Partial<GlobeQualityConfig> = {};

  if (typeof value.reliefMapEnabled === 'boolean') {
    next.reliefMapEnabled = value.reliefMapEnabled;
  }
  if (
    typeof value.reliefHeight === 'number' &&
    Number.isFinite(value.reliefHeight)
  ) {
    next.reliefHeight = Math.max(0, Math.min(3, value.reliefHeight));
  }
  if (typeof value.dayImageryEnabled === 'boolean') {
    next.dayImageryEnabled = value.dayImageryEnabled;
  }
  if (typeof value.nightImageryEnabled === 'boolean') {
    next.nightImageryEnabled = value.nightImageryEnabled;
  }
  if (typeof value.waterMaskEnabled === 'boolean') {
    next.waterMaskEnabled = value.waterMaskEnabled;
  }
  if (typeof value.cityLightsEnabled === 'boolean') {
    next.cityLightsEnabled = value.cityLightsEnabled;
  }
  if (
    typeof value.cityLightsIntensity === 'number' &&
    Number.isFinite(value.cityLightsIntensity)
  ) {
    next.cityLightsIntensity = Math.max(0, Math.min(4, value.cityLightsIntensity));
  }
  if (
    typeof value.cityLightsThreshold === 'number' &&
    Number.isFinite(value.cityLightsThreshold)
  ) {
    next.cityLightsThreshold = Math.max(0, Math.min(0.95, value.cityLightsThreshold));
  }
  if (
    typeof value.cityLightsGlow === 'number' &&
    Number.isFinite(value.cityLightsGlow)
  ) {
    next.cityLightsGlow = Math.max(0, Math.min(4, value.cityLightsGlow));
  }
  if (
    typeof value.cityLightsColor === 'string' &&
    value.cityLightsColor.length > 0
  ) {
    next.cityLightsColor = value.cityLightsColor;
  }
  if (typeof value.lightPollutionEnabled === 'boolean') {
    next.lightPollutionEnabled = value.lightPollutionEnabled;
  }
  if (
    typeof value.lightPollutionIntensity === 'number' &&
    Number.isFinite(value.lightPollutionIntensity)
  ) {
    next.lightPollutionIntensity = Math.max(
      0,
      Math.min(4, value.lightPollutionIntensity),
    );
  }
  if (
    typeof value.lightPollutionSpread === 'number' &&
    Number.isFinite(value.lightPollutionSpread)
  ) {
    next.lightPollutionSpread = Math.max(0.25, Math.min(6, value.lightPollutionSpread));
  }
  if (
    typeof value.lightPollutionColor === 'string' &&
    value.lightPollutionColor.length > 0
  ) {
    next.lightPollutionColor = value.lightPollutionColor;
  }
  if (
    typeof value.umbraDarkness === 'number' &&
    Number.isFinite(value.umbraDarkness)
  ) {
    next.umbraDarkness = Math.max(0, Math.min(1, value.umbraDarkness));
  }
  if (typeof value.showLakes === 'boolean') {
    next.showLakes = value.showLakes;
  }
  if (typeof value.showRivers === 'boolean') {
    next.showRivers = value.showRivers;
  }
  if (
    typeof value.lakesOpacity === 'number' &&
    Number.isFinite(value.lakesOpacity)
  ) {
    next.lakesOpacity = Math.max(0, Math.min(1, value.lakesOpacity));
  }
  if (
    typeof value.riversOpacity === 'number' &&
    Number.isFinite(value.riversOpacity)
  ) {
    next.riversOpacity = Math.max(0, Math.min(1, value.riversOpacity));
  }
  if (
    typeof value.riversWidth === 'number' &&
    Number.isFinite(value.riversWidth)
  ) {
    next.riversWidth = Math.max(0.1, Math.min(5, value.riversWidth));
  }
  if (typeof value.lakesColor === 'string' && value.lakesColor.length > 0) {
    next.lakesColor = value.lakesColor;
  }
  if (typeof value.riversColor === 'string' && value.riversColor.length > 0) {
    next.riversColor = value.riversColor;
  }

  return next;
}

function parseStoredOverride(storageKey: string): Partial<GlobeQualityConfig> {
  if (!isBrowser()) {
    return {};
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return sanitizeOverride(parsed as Partial<GlobeQualityConfig>);
  } catch {
    return {};
  }
}

function isOverrideEmpty(value: Partial<GlobeQualityConfig>) {
  return Object.keys(value).length === 0;
}

export function useGlobeAdminTuning({
  defaults,
  themeId,
}: UseGlobeAdminTuningArgs): UseGlobeAdminTuningResult {
  const adminEnabled = true;

  const storageKey = useMemo(() => getStorageKey(themeId), [themeId]);
  const [resetRevision, setResetRevision] = useState(0);
  const [adminOverride, setAdminOverride] = useState<
    Partial<GlobeQualityConfig>
  >(() => parseStoredOverride(storageKey));

  useEffect(() => {
    setAdminOverride(parseStoredOverride(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (!isBrowser() || !adminEnabled) {
      return;
    }

    if (isOverrideEmpty(adminOverride)) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(adminOverride));
  }, [adminEnabled, adminOverride, storageKey]);

  const setAdminOverridePatch = useCallback(
    (patch: Partial<GlobeQualityConfig>) => {
      const sanitizedPatch = sanitizeOverride(patch);
      if (isOverrideEmpty(sanitizedPatch)) {
        return;
      }

      setAdminOverride((previous) => ({
        ...previous,
        ...sanitizedPatch,
      }));
    },
    [],
  );

  const resetAdminOverride = useCallback(() => {
    setAdminOverride({});
    setResetRevision((value) => value + 1);
    if (isBrowser()) {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const effectiveQuality = useMemo(
    () =>
      adminEnabled
        ? {
            ...defaults,
            ...adminOverride,
          }
        : defaults,
    [adminEnabled, adminOverride, defaults],
  );

  return {
    adminEnabled,
    effectiveQuality,
    resetAdminOverride,
    resetRevision,
    setAdminOverridePatch,
  };
}
