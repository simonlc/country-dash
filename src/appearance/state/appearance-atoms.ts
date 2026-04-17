import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import {
  appThemes,
  createAppTheme,
  defaultAppThemeId,
  getAppThemeDefinition,
  type AppThemeId,
} from '@/app/theme';

const themeStorageKey = 'country-dash:theme:v1';
const legacyThemeStorageKey = 'country-guesser-theme';

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

function isAppThemeId(value: string): value is AppThemeId {
  return appThemes.some((theme) => theme.id === value);
}

const themeStorage = {
  getItem(key: string, initialValue: AppThemeId) {
    const storage = getBrowserStorage();
    if (!storage) {
      return initialValue;
    }

    const storedValue = storage.getItem(key);
    if (storedValue && isAppThemeId(storedValue)) {
      return storedValue;
    }

    const legacyValue = storage.getItem(legacyThemeStorageKey);
    if (!legacyValue || !isAppThemeId(legacyValue)) {
      return initialValue;
    }

    storage.setItem(key, legacyValue);
    storage.removeItem(legacyThemeStorageKey);
    return legacyValue;
  },
  removeItem(key: string) {
    const storage = getBrowserStorage();
    if (!storage) {
      return;
    }

    storage.removeItem(key);
  },
  setItem(key: string, value: AppThemeId) {
    const storage = getBrowserStorage();
    if (!storage) {
      return;
    }

    storage.setItem(key, value);
  },
};

export const themeIdAtom = atomWithStorage<AppThemeId>(
  themeStorageKey,
  defaultAppThemeId,
  themeStorage,
  {
    getOnInit: true,
  },
);

export const activeThemeAtom = atom((get) => getAppThemeDefinition(get(themeIdAtom)));

export const uiThemeAtom = atom((get) => createAppTheme(get(themeIdAtom)));
