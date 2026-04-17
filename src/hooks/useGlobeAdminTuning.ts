import { useCallback, useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { RESET } from 'jotai/utils';
import type { AppThemeId, GlobeThemeSettings } from '@/app/theme';
import {
  adminEnabledAtom,
  adminOverrideAtomFamily,
  adminResetRevisionAtomFamily,
} from '@/globe-admin/state/globe-admin-atoms';
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

export interface UseGlobeAdminTuningResult {
  adminEnabled: boolean;
  effectiveSettings: GlobeThemeSettings;
  resetAdminOverride: () => void;
  resetRevision: number;
  setAdminOverridePatch: (patch: GlobeThemeSettingsPatch) => void;
}

export function useGlobeAdminTuning({
  defaults,
  themeId,
}: UseGlobeAdminTuningArgs): UseGlobeAdminTuningResult {
  const adminEnabled = useAtomValue(adminEnabledAtom);
  const [adminOverride, setAdminOverride] = useAtom(
    adminOverrideAtomFamily(themeId),
  );
  const [resetRevision, setResetRevision] = useAtom(
    adminResetRevisionAtomFamily(themeId),
  );

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
    [setAdminOverride],
  );

  const resetAdminOverride = useCallback(() => {
    setAdminOverride(RESET);
    setResetRevision((value) => value + 1);
  }, [setAdminOverride, setResetRevision]);

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
