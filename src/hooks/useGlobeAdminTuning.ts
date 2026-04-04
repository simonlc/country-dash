import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppThemeId, GlobeThemeSettings } from '@/app/theme';
import {
  hasThemeSettingsPatch,
  mergeThemeSettings,
  sanitizeGlobeThemeSettingsPatch,
  type GlobeThemeSettingsPatch,
} from '@/utils/globeQualityControls';

interface UseGlobeAdminTuningArgs {
  defaults: GlobeThemeSettings;
  themeId: AppThemeId;
}

interface UseGlobeAdminTuningResult {
  adminEnabled: boolean;
  effectiveSettings: GlobeThemeSettings;
  resetAdminOverride: () => void;
  resetRevision: number;
  setAdminOverridePatch: (patch: GlobeThemeSettingsPatch) => void;
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function getStorageKey(themeId: AppThemeId) {
  return `country-guesser-admin-theme:${themeId}`;
}

function parseStoredOverride(storageKey: string): GlobeThemeSettingsPatch {
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

    return sanitizeGlobeThemeSettingsPatch(parsed as GlobeThemeSettingsPatch);
  } catch {
    return {};
  }
}

export function useGlobeAdminTuning({
  defaults,
  themeId,
}: UseGlobeAdminTuningArgs): UseGlobeAdminTuningResult {
  const adminEnabled = true;

  const storageKey = useMemo(() => getStorageKey(themeId), [themeId]);
  const [resetRevision, setResetRevision] = useState(0);
  const [adminOverride, setAdminOverride] = useState<GlobeThemeSettingsPatch>(
    () => parseStoredOverride(storageKey),
  );

  useEffect(() => {
    setAdminOverride(parseStoredOverride(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (!isBrowser() || !adminEnabled) {
      return;
    }

    if (!hasThemeSettingsPatch(adminOverride)) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(adminOverride));
  }, [adminEnabled, adminOverride, storageKey]);

  const setAdminOverridePatch = useCallback(
    (patch: GlobeThemeSettingsPatch) => {
      const sanitizedPatch = sanitizeGlobeThemeSettingsPatch(patch);
      if (!hasThemeSettingsPatch(sanitizedPatch)) {
        return;
      }

      setAdminOverride((previous) => ({
        globe: {
          ...previous.globe,
          ...sanitizedPatch.globe,
        },
        quality: {
          ...previous.quality,
          ...sanitizedPatch.quality,
        },
        render: {
          ...previous.render,
          ...sanitizedPatch.render,
        },
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

  const effectiveSettings = useMemo(
    () =>
      adminEnabled ? mergeThemeSettings(defaults, adminOverride) : defaults,
    [adminEnabled, adminOverride, defaults],
  );

  return {
    adminEnabled,
    effectiveSettings,
    resetAdminOverride,
    resetRevision,
    setAdminOverridePatch,
  };
}
