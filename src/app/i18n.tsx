import {
  type PropsWithChildren,
  useEffect,
  useMemo,
} from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  getTextDirection,
  locales,
  type Locale,
} from '@/paraglide/runtime.js';
import { localeAtom, setLocaleAtom } from '@/i18n/state/i18n-atoms';

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
  const locale = useAtomValue(localeAtom);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getTextDirection(locale);
  }, [locale]);

  return children;
}

export function useI18n() {
  const locale = useAtomValue(localeAtom);
  const setLocale = useSetAtom(setLocaleAtom);

  return useMemo<I18nContextValue>(
    () => ({
      languages: locales.map((languageLocale) => getLanguageOption(languageLocale)),
      locale,
      setLocale,
    }),
    [locale, setLocale],
  );
}
