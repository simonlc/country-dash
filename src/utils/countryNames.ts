import type { CountryProperties } from '@/types/game';

function normalizeLocale(value: string) {
  return value.trim().toLowerCase();
}

export function getCountryDisplayName(
  country: CountryProperties,
  locale: string,
): string {
  const localizedNames = country.localizedNames ?? {};
  const normalizedLocale = normalizeLocale(locale);
  const languageOnlyLocale = normalizedLocale.split('-')[0];

  if (normalizedLocale in localizedNames) {
    return localizedNames[normalizedLocale] ?? country.nameEn;
  }

  if (languageOnlyLocale && languageOnlyLocale in localizedNames) {
    return localizedNames[languageOnlyLocale] ?? country.nameEn;
  }

  return localizedNames.en ?? country.nameEn;
}

export function getCountryNameCandidates(country: CountryProperties): string[] {
  return Array.from(
    new Set(
      [
        ...Object.values(country.localizedNames ?? {}),
        country.nameEn,
        country.name ?? '',
        country.abbr ?? '',
        country.formalName ?? '',
        country.nameAlt ?? '',
        country.isocode,
        country.isocode3,
      ].filter((value): value is string => Boolean(value)),
    ),
  );
}
