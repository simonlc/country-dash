import * as topojson from 'topojson-client';
import { countries as countriesList } from 'countries-list';
import { countryCapitals } from 'country-capitals';
import { City } from 'country-state-city';
import worldSource from '../../world.json';
import type {
  CountryFeature,
  CountryProperties,
  CountryTag,
  FeatureCollectionLike,
  WorldData,
  WorldTopologyGeometryCollection,
  WorldTopologyObject,
} from '@/types/game';

interface SourceCountryProperties {
  ISO_A2?: string;
  ISO_A3?: string;
  CONTINENT?: string;
  REGION_UN?: string;
  SUBREGION?: string;
  NAME_EN?: string | null;
  [key: `NAME_${string}`]: string | number | null | undefined;
}

const microstateCodes = new Set([
  'AD',
  'AG',
  'AI',
  'AW',
  'BB',
  'BH',
  'BL',
  'BM',
  'BN',
  'DM',
  'GD',
  'GG',
  'GI',
  'IM',
  'JE',
  'KN',
  'KY',
  'LC',
  'LI',
  'LU',
  'MC',
  'MF',
  'MO',
  'MS',
  'MT',
  'MV',
  'NR',
  'PM',
  'PW',
  'SC',
  'SG',
  'SM',
  'ST',
  'SX',
  'TC',
  'TO',
  'TV',
  'VA',
  'VC',
  'VG',
]);

const islandNationCodes = new Set([
  'AG',
  'AU',
  'BB',
  'BH',
  'BS',
  'CV',
  'CY',
  'DM',
  'DO',
  'FJ',
  'FM',
  'GB',
  'GD',
  'HT',
  'ID',
  'IE',
  'IS',
  'JM',
  'JP',
  'KI',
  'KN',
  'LK',
  'MG',
  'MH',
  'MT',
  'MU',
  'MV',
  'NR',
  'NZ',
  'PG',
  'PH',
  'PW',
  'SB',
  'SC',
  'SG',
  'ST',
  'TL',
  'TO',
  'TT',
  'TV',
  'VC',
  'VU',
  'WS',
]);

const caribbeanCodes = new Set([
  'AG',
  'BB',
  'BS',
  'CU',
  'DM',
  'DO',
  'GD',
  'HT',
  'JM',
  'KN',
  'LC',
  'TT',
  'VC',
]);

const middleEastCodes = new Set([
  'AE',
  'AM',
  'AZ',
  'BH',
  'CY',
  'EG',
  'GE',
  'IL',
  'IQ',
  'IR',
  'JO',
  'KW',
  'LB',
  'OM',
  'PS',
  'QA',
  'SA',
  'SY',
  'TR',
  'YE',
]);

const countriesByIso2 = countriesList as Record<string, { capital?: string }>;
const capitalsByIso2 = countryCapitals as Record<string, string>;
type CountryCity = NonNullable<ReturnType<typeof City.getCitiesOfCountry>>[number];

function buildCountryTags(isocode: string): CountryTag[] {
  const tags: CountryTag[] = [];

  if (microstateCodes.has(isocode)) {
    tags.push('microstate');
  }
  if (islandNationCodes.has(isocode)) {
    tags.push('islandNation');
  }
  if (caribbeanCodes.has(isocode)) {
    tags.push('caribbean');
  }
  if (middleEastCodes.has(isocode)) {
    tags.push('middleEast');
  }

  return tags;
}

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return (await response.json()) as T;
}

function normalizeCountryKeyPart(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function normalizeCountryLookupCode(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().toUpperCase();
  if (!trimmed || trimmed === '-99') {
    return null;
  }

  if (/^[A-Z]{2,3}$/.test(trimmed)) {
    return trimmed;
  }

  const suffix = trimmed.split('-').at(-1);
  if (suffix && /^[A-Z]{2,3}$/.test(suffix)) {
    return suffix;
  }

  return null;
}

function getFirstObject(
  topology: WorldTopologyObject,
): WorldTopologyGeometryCollection {
  const [firstKey] = Object.keys(topology.objects);
  if (!firstKey) {
    throw new Error('Topology object is empty');
  }
  const object = topology.objects[firstKey];
  if (!object) {
    throw new Error('Topology object is missing');
  }
  return object;
}

export function getCountryLookupKey(args: {
  isocode?: string | null | undefined;
  isocode3?: string | null | undefined;
  nameEn?: string | null | undefined;
}) {
  const normalizedIso2 = normalizeCountryLookupCode(args.isocode);
  if (normalizedIso2) {
    return `iso2:${normalizedIso2}`;
  }

  const normalizedIso3 = normalizeCountryLookupCode(args.isocode3);
  if (normalizedIso3) {
    return `iso3:${normalizedIso3}`;
  }

  const normalizedName = normalizeCountryKeyPart(args.nameEn);
  return normalizedName ? `name:${normalizedName}` : null;
}

function createFallbackCountryFeatureId(feature: CountryFeature, index: number) {
  const normalizedName = normalizeCountryKeyPart(feature.properties.nameEn);
  if (normalizedName) {
    return `country-${normalizedName}`;
  }

  const lookupKey = getCountryLookupKey({
    isocode: feature.properties.isocode,
    isocode3: feature.properties.isocode3,
    nameEn: feature.properties.nameEn,
  });
  if (lookupKey) {
    return lookupKey.replace(':', '-');
  }

  return `country-${index + 1}`;
}

export function assignUniqueCountryFeatureIds(
  world: FeatureCollectionLike,
): FeatureCollectionLike {
  const seenIds = new Map<string, number>();

  return {
    ...world,
    features: world.features.map((feature, index) => {
      const rawId = feature.id.trim();
      const candidateId =
        rawId && rawId !== '-99' && !seenIds.has(rawId)
          ? rawId
          : createFallbackCountryFeatureId(feature, index);
      const duplicateCount = seenIds.get(candidateId) ?? 0;
      const uniqueId =
        duplicateCount === 0 ? candidateId : `${candidateId}-${duplicateCount + 1}`;

      seenIds.set(candidateId, duplicateCount + 1);

      return {
        ...feature,
        id: uniqueId,
      };
    }),
  };
}

function toFeatureCollection(topology: WorldTopologyObject): FeatureCollectionLike {
  const featureCollection = topojson.feature(
    topology,
    getFirstObject(topology),
  ) as FeatureCollectionLike;

  return assignUniqueCountryFeatureIds(featureCollection);
}

const languageByWorldNameKey: Record<string, string> = {
  AR: 'ar',
  BN: 'bn',
  DE: 'de',
  EL: 'el',
  EN: 'en',
  ES: 'es',
  FA: 'fa',
  FR: 'fr',
  HE: 'he',
  HI: 'hi',
  HU: 'hu',
  ID: 'id',
  IT: 'it',
  JA: 'ja',
  KO: 'ko',
  NL: 'nl',
  PL: 'pl',
  PT: 'pt',
  RU: 'ru',
  SV: 'sv',
  TR: 'tr',
  UK: 'uk',
  UR: 'ur',
  VI: 'vi',
  ZH: 'zh',
  ZHT: 'zh-hant',
};

const nonLanguageWorldNameKeys = new Set(['ALT', 'CIAWF', 'LONG', 'SORT']);

function normalizeWorldNameKeyToLanguage(nameKey: string) {
  const key = nameKey.trim().toUpperCase();
  return languageByWorldNameKey[key] ?? key.toLowerCase();
}

function extractLocalizedCountryNames(properties: SourceCountryProperties) {
  const localizedNames: Record<string, string> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (!key.startsWith('NAME_') || typeof value !== 'string') {
      continue;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      continue;
    }

    const worldNameKey = key.slice('NAME_'.length);
    if (nonLanguageWorldNameKeys.has(worldNameKey.toUpperCase())) {
      continue;
    }

    const languageTag = normalizeWorldNameKeyToLanguage(worldNameKey);
    localizedNames[languageTag] = trimmedValue;
  }

  if (!localizedNames.en && properties.NAME_EN) {
    const englishName = properties.NAME_EN.trim();
    if (englishName) {
      localizedNames.en = englishName;
    }
  }

  return localizedNames;
}

function buildCountrySourceMap() {
  const sourceFeatures = (worldSource as { features: Array<{ properties: SourceCountryProperties }> })
    .features;
  const countryNameLanguages = new Set<string>();

  const detailsByKey = new Map(
    sourceFeatures.flatMap((feature) => {
      const lookupKey = getCountryLookupKey({
        isocode: feature.properties.ISO_A2,
        isocode3: feature.properties.ISO_A3,
        nameEn: feature.properties.NAME_EN,
      });
      if (!lookupKey) {
        return [];
      }

      const metadata = {
        continent: feature.properties.CONTINENT ?? null,
        localizedNames: extractLocalizedCountryNames(feature.properties),
        region: feature.properties.REGION_UN ?? null,
        subregion: feature.properties.SUBREGION ?? null,
      };
      Object.keys(metadata.localizedNames).forEach((language) => {
        countryNameLanguages.add(language);
      });

      return [[lookupKey, metadata] as const];
    }),
  );

  return {
    countryNameLanguages: Array.from(countryNameLanguages).sort((left, right) =>
      left.localeCompare(right),
    ),
    detailsByKey,
  };
}

function normalizeIso2Code(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(trimmed)) {
    return trimmed;
  }

  const suffix = trimmed.split('-').at(-1);
  if (suffix && /^[A-Z]{2}$/.test(suffix)) {
    return suffix;
  }

  return null;
}

function normalizeCapitalName(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeCapitalMatchKey(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.'’()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function parseCoordinate(value: string | number | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const citiesByIsoCode = new Map<string, CountryCity[]>();

function getCitiesByCountryCode(countryCode: string) {
  const cached = citiesByIsoCode.get(countryCode);
  if (cached) {
    return cached;
  }

  const cities = City.getCitiesOfCountry(countryCode);
  const resolvedCities = cities ?? [];
  citiesByIsoCode.set(countryCode, resolvedCities);
  return resolvedCities;
}

function getCapitalCoordinates(
  isocode: string,
  capitalAliases: string[],
) {
  const normalizedIso2 = normalizeIso2Code(isocode);
  if (!normalizedIso2 || capitalAliases.length === 0) {
    return {
      latitude: null,
      longitude: null,
    };
  }

  const aliasKeys = new Set(
    capitalAliases
      .map((alias) => normalizeCapitalMatchKey(alias))
      .filter((value) => value.length > 0),
  );
  const cities = getCitiesByCountryCode(normalizedIso2);
  const matchedCity = cities.find((city) =>
    aliasKeys.has(normalizeCapitalMatchKey(city.name)),
  );

  if (!matchedCity) {
    return {
      latitude: null,
      longitude: null,
    };
  }

  return {
    latitude: parseCoordinate(matchedCity.latitude),
    longitude: parseCoordinate(matchedCity.longitude),
  };
}

function getCapitalMetadata(country: { isocode: string; isocode3: string }) {
  const normalizedIso2 = normalizeIso2Code(country.isocode);
  const capitalFromList = normalizedIso2
    ? normalizeCapitalName(countriesByIso2[normalizedIso2]?.capital)
    : null;
  const capitalFromCountryCapitals = normalizedIso2
    ? normalizeCapitalName(capitalsByIso2[normalizedIso2])
    : null;
  const aliases = [capitalFromList, capitalFromCountryCapitals].filter(
    (value): value is string => Boolean(value),
  );
  const uniqueAliases = Array.from(new Set(aliases));

  return {
    aliases: uniqueAliases,
    name: uniqueAliases[0] ?? null,
  };
}

function enrichFeatureCollection(
  world: FeatureCollectionLike,
  detailsByKey: ReturnType<typeof buildCountrySourceMap>['detailsByKey'],
): FeatureCollectionLike {
  return {
    ...world,
    features: world.features.map((feature) => {
      const lookupKey = getCountryLookupKey({
        isocode: feature.properties.isocode,
        isocode3: feature.properties.isocode3,
        nameEn: feature.properties.nameEn,
      });
      const metadata = lookupKey ? detailsByKey.get(lookupKey) : undefined;
      const capitalMetadata = getCapitalMetadata(feature.properties);
      const capitalCoordinates = getCapitalCoordinates(
        feature.properties.isocode,
        capitalMetadata.aliases,
      );
      const tags = buildCountryTags(feature.properties.isocode);
      const properties: CountryProperties = {
        ...feature.properties,
        capitalAliases: capitalMetadata.aliases,
        capitalLatitude: capitalCoordinates.latitude,
        capitalLongitude: capitalCoordinates.longitude,
        capitalName: capitalMetadata.name,
        continent: metadata?.continent ?? null,
        localizedNames: { ...(metadata?.localizedNames ?? {}) },
        region: metadata?.region ?? null,
        subregion: metadata?.subregion ?? null,
        tags,
      };

      return {
        ...feature,
        properties,
      };
    }),
  };
}

export async function loadWorldData(): Promise<WorldData> {
  const worldTopology = await loadJson<WorldTopologyObject>('data/world-topo.json');
  const sourceMap = buildCountrySourceMap();

  return {
    countryNameLanguages: sourceMap.countryNameLanguages,
    world: enrichFeatureCollection(toFeatureCollection(worldTopology), sourceMap.detailsByKey),
  };
}
