import * as topojson from 'topojson-client';
import { countries as countriesList } from 'countries-list';
import { countryCapitals } from 'country-capitals';
import worldSource from '../../../../world.json';
import type {
  CountryProperties,
  CountryTag,
  FeatureCollectionLike,
  WorldData,
  WorldTopologyGeometryCollection,
  WorldTopologyObject,
} from '@/features/game/types';

interface SourceCountryProperties {
  ISO_A2?: string;
  ISO_A3?: string;
  CONTINENT?: string;
  REGION_UN?: string;
  SUBREGION?: string;
  LABEL_X?: number;
  LABEL_Y?: number;
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

function toFeatureCollection(topology: WorldTopologyObject): FeatureCollectionLike {
  return topojson.feature(topology, getFirstObject(topology)) as FeatureCollectionLike;
}

function buildMetadataMap() {
  const sourceFeatures = (worldSource as { features: Array<{ properties: SourceCountryProperties }> })
    .features;

  return new Map(
    sourceFeatures.flatMap((feature) => {
      const isocode = feature.properties.ISO_A2;
      const isocode3 = feature.properties.ISO_A3;

      if (!isocode && !isocode3) {
        return [];
      }

      const metadata = {
        capitalLatitude: feature.properties.LABEL_Y ?? null,
        capitalLongitude: feature.properties.LABEL_X ?? null,
        continent: feature.properties.CONTINENT ?? null,
        region: feature.properties.REGION_UN ?? null,
        subregion: feature.properties.SUBREGION ?? null,
      };

      return [
        ...(isocode ? [[isocode, metadata] as const] : []),
        ...(isocode3 ? [[isocode3, metadata] as const] : []),
      ];
    }),
  );
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

function enrichFeatureCollection(world: FeatureCollectionLike): FeatureCollectionLike {
  const metadataByCode = buildMetadataMap();

  return {
    ...world,
    features: world.features.map((feature) => {
      const metadata =
        metadataByCode.get(feature.properties.isocode) ??
        metadataByCode.get(feature.properties.isocode3);
      const capitalMetadata = getCapitalMetadata(feature.properties);
      const tags = buildCountryTags(feature.properties.isocode);
      const properties: CountryProperties = {
        ...feature.properties,
        capitalAliases: capitalMetadata.aliases,
        capitalLatitude: metadata?.capitalLatitude ?? null,
        capitalLongitude: metadata?.capitalLongitude ?? null,
        capitalName: capitalMetadata.name,
        continent: metadata?.continent ?? null,
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

  return {
    world: enrichFeatureCollection(toFeatureCollection(worldTopology)),
  };
}
