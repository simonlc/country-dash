import { atom } from 'jotai';
import { atomFamily, atomWithStorage } from 'jotai/utils';
import type { AppThemeId } from '@/app/theme';
import {
  sanitizeGlobeThemeSettingsPatch,
  type GlobeThemeSettingsPatch,
} from '@/utils/globeQualityControls';

const globeAdminStoragePrefix = 'country-dash:globe-admin:v1:';
const legacyGlobeAdminStoragePrefix = 'country-guesser-admin-theme:';

interface BrowserStorage {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
}

function getBrowserStorage(): BrowserStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storage = window.localStorage as Partial<BrowserStorage>;
  if (
    typeof storage.getItem !== 'function' ||
    typeof storage.setItem !== 'function' ||
    typeof storage.removeItem !== 'function'
  ) {
    return null;
  }

  return storage as BrowserStorage;
}

function getStorageKey(themeId: AppThemeId) {
  return `${globeAdminStoragePrefix}${themeId}`;
}

function getLegacyStorageKey(themeId: AppThemeId) {
  return `${legacyGlobeAdminStoragePrefix}${themeId}`;
}

function parseStoredPatch(raw: string | null) {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as GlobeThemeSettingsPatch;
    return sanitizeGlobeThemeSettingsPatch(parsed);
  } catch {
    return {};
  }
}

function createThemePatchStorage(themeId: AppThemeId) {
  const key = getStorageKey(themeId);
  const legacyKey = getLegacyStorageKey(themeId);

  return {
    getItem(keyArg: string, initialValue: GlobeThemeSettingsPatch) {
      void keyArg;
      const storage = getBrowserStorage();
      if (!storage) {
        return initialValue;
      }

      const storedValue = parseStoredPatch(storage.getItem(key));
      if (Object.keys(storedValue).length > 0) {
        return storedValue;
      }

      const legacyValue = parseStoredPatch(storage.getItem(legacyKey));
      if (Object.keys(legacyValue).length === 0) {
        return initialValue;
      }

      storage.setItem(key, JSON.stringify(legacyValue));
      storage.removeItem(legacyKey);
      return legacyValue;
    },
    removeItem(keyArg: string) {
      void keyArg;
      const storage = getBrowserStorage();
      if (!storage) {
        return;
      }

      storage.removeItem(key);
    },
    setItem(keyArg: string, value: GlobeThemeSettingsPatch) {
      void keyArg;
      const storage = getBrowserStorage();
      if (!storage) {
        return;
      }

      storage.setItem(key, JSON.stringify(value));
    },
  };
}

export const adminEnabledAtom = atom(true);

export const adminOverrideAtomFamily = atomFamily((themeId: AppThemeId) =>
  atomWithStorage<GlobeThemeSettingsPatch>(
    getStorageKey(themeId),
    {},
    createThemePatchStorage(themeId),
    {
      getOnInit: true,
    },
  ),
);

export const adminResetRevisionAtomFamily = atomFamily((themeId: AppThemeId) => {
  void themeId;
  return atom(0);
});
