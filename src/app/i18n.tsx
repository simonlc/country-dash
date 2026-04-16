import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  baseLocale,
  getLocale,
  getTextDirection,
  locales,
  setLocale as setParaglideLocale,
  type Locale,
} from '@/paraglide/runtime.js';

interface LanguageOption {
  englishLabel: string;
  locale: Locale;
  nativeLabel: string;
}

interface I18nContextValue {
  languages: LanguageOption[];
  locale: Locale;
  setLocale: (nextLocale: Locale) => Promise<void>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const localeFallbackLabels: Record<string, { english: string; native: string }> = {
  en: {
    english: 'English',
    native: 'English',
  },
  fr: {
    english: 'French',
    native: 'Français',
  },
};

function resolveInitialLocale(): Locale {
  const resolved = getLocale();
  return locales.includes(resolved) ? resolved : baseLocale;
}

function getLanguageOption(locale: Locale): LanguageOption {
  const fallback = localeFallbackLabels[locale] ?? {
    english: locale,
    native: locale,
  };

  const englishLabel = new Intl.DisplayNames(['en'], { type: 'language' }).of(locale);
  const nativeLabel = new Intl.DisplayNames([locale], { type: 'language' }).of(locale);

  return {
    englishLabel: englishLabel ?? fallback.english,
    locale,
    nativeLabel: nativeLabel ?? fallback.native,
  };
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(resolveInitialLocale);

  const setLocale = useCallback(async (nextLocale: Locale) => {
    if (nextLocale === locale) {
      return;
    }

    await Promise.resolve(setParaglideLocale(nextLocale, { reload: false }));
    setLocaleState(nextLocale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getTextDirection(locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      languages: locales.map((languageLocale) => getLanguageOption(languageLocale)),
      locale,
      setLocale,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }

  return context;
}
