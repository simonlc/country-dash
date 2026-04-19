import { describe, expect, it } from 'vitest';
import type { CountryFeature, FeatureCollectionLike } from '@/types/game';
import {
  assignUniqueCountryFeatureIds,
  getCountryLookupKey,
} from '@/utils/loadWorldData';

function createCountryFeature(args: {
  id: string;
  isocode: string;
  isocode3: string;
  nameEn: string;
}): CountryFeature {
  return {
    id: args.id,
    type: 'Feature',
    properties: {
      isocode: args.isocode,
      isocode3: args.isocode3,
      nameEn: args.nameEn,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
      ],
    },
  };
}

describe('getCountryLookupKey', () => {
  it('falls back to the country name for unrecognized disputed entries', () => {
    expect(
      getCountryLookupKey({
        isocode: '-99',
        isocode3: '-99',
        nameEn: 'Siachen Glacier',
      }),
    ).toBe('name:siachen-glacier');
  });

  it('normalizes suffixed iso codes to a stable key', () => {
    expect(
      getCountryLookupKey({
        isocode: 'CN-TW',
        isocode3: 'TWN',
        nameEn: 'Taiwan',
      }),
    ).toBe('iso2:TW');
  });
});

describe('assignUniqueCountryFeatureIds', () => {
  it('preserves existing unique ids and rewrites duplicate disputed ids', () => {
    const world: FeatureCollectionLike = {
      type: 'FeatureCollection',
      features: [
        createCountryFeature({
          id: 'USA',
          isocode: 'US',
          isocode3: 'USA',
          nameEn: 'United States of America',
        }),
        createCountryFeature({
          id: '-99',
          isocode: '-99',
          isocode3: '-99',
          nameEn: 'Somaliland',
        }),
        createCountryFeature({
          id: '-99',
          isocode: '-99',
          isocode3: '-99',
          nameEn: 'Siachen Glacier',
        }),
      ],
    };

    expect(assignUniqueCountryFeatureIds(world).features.map((feature) => feature.id)).toEqual([
      'USA',
      'country-somaliland',
      'country-siachen-glacier',
    ]);
  });
});
