import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import {
  baseLocale,
  getLocale,
  locales,
  setLocale as setParaglideLocale,
  type Locale,
} from '@/paraglide/runtime.js';

const localeStorageKey = 'country-dash:locale:v1';

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

function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

function resolveRuntimeLocale() {
  const resolved = getLocale();
  return isLocale(resolved) ? resolved : baseLocale;
}

const localeStorage = {
  getItem(key: string, initialValue: Locale) {
    const storage = getBrowserStorage();
    if (!storage) {
      return initialValue;
    }

    const storedValue = storage.getItem(key);
    if (storedValue && isLocale(storedValue)) {
      return storedValue;
    }

    return resolveRuntimeLocale();
  },
  removeItem(key: string) {
    const storage = getBrowserStorage();
    if (!storage) {
      return;
    }

    storage.removeItem(key);
  },
  setItem(key: string, value: Locale) {
    const storage = getBrowserStorage();
    if (!storage) {
      return;
    }

    storage.setItem(key, value);
  },
};

export const localeAtom = atomWithStorage<Locale>(
  localeStorageKey,
  baseLocale,
  localeStorage,
  {
    getOnInit: true,
  },
);

export const setLocaleAtom = atom(
  null,
  async (get, set, nextLocale: Locale) => {
    if (nextLocale === get(localeAtom)) {
      return;
    }

    await Promise.resolve(setParaglideLocale(nextLocale, { reload: false }));
    set(localeAtom, nextLocale);
  },
);
