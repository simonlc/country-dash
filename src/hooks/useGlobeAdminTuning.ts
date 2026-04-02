import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppThemeId, GlobeQualityConfig } from '@/app/theme';
import { sanitizeGlobeQualityPatch } from '@/utils/globeQualityControls';

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

    return sanitizeGlobeQualityPatch(parsed as Partial<GlobeQualityConfig>);
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
      const sanitizedPatch = sanitizeGlobeQualityPatch(patch);
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
