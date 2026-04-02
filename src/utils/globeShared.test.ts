import { describe, expect, it } from 'vitest';
import {
  getCountryHighlightRings,
  getProjectedTerminatorHalfWidthPx,
  getTerminatorHalfAngleRadians,
  getTerminatorHalfWidthKilometers,
} from '@/utils/globeShared';
import type { CountryFeature } from '@/types/game';

function createCountryFeature(
  id: string,
  geometry: CountryFeature['geometry'],
): CountryFeature {
  return {
    id,
    type: 'Feature',
    properties: {
      continent: 'Oceania',
      isocode: id,
      isocode3: id,
      nameEn: id,
      region: 'Oceania',
      subregion: 'Micronesia',
      tags: ['islandNation'],
    },
    geometry,
  };
}

describe('getCountryHighlightRings', () => {
  it('keeps a single ring for compact microstates', () => {
    const country = createCountryFeature('NR', {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [0, 0.1],
          [0.1, 0.1],
          [0.1, 0],
          [0, 0],
        ],
      ],
    });

    const rings = getCountryHighlightRings(country);

    expect(rings).toHaveLength(1);
    expect(rings[0]?.radius).toBe(1);
  });

  it('adds multiple rings for fragmented archipelagos', () => {
    const country = createCountryFeature('KI', {
      type: 'MultiPolygon',
      coordinates: [
        [[[-170, 0], [-170, 0.2], [-169.8, 0.2], [-169.8, 0], [-170, 0]]],
        [[[-160, 1], [-160, 1.2], [-159.8, 1.2], [-159.8, 1], [-160, 1]]],
        [[[-150, -1], [-150, -0.8], [-149.8, -0.8], [-149.8, -1], [-150, -1]]],
      ],
    });

    const rings = getCountryHighlightRings(country);

    expect(rings).toHaveLength(3);
    expect(rings.every((ring) => ring.radius > 0.8)).toBe(true);
  });

  it('skips rings for larger multi-part countries that are already visible', () => {
    const country = createCountryFeature('FJ', {
      type: 'MultiPolygon',
      coordinates: [
        [[[-20, 0], [-20, 1], [-19, 1], [-19, 0], [-20, 0]]],
        [[[-17, 0], [-17, 1], [-16, 1], [-16, 0], [-17, 0]]],
        [[[-14, 0], [-14, 1], [-13, 1], [-13, 0], [-14, 0]]],
      ],
    });

    expect(getCountryHighlightRings(country)).toEqual([]);
  });
});

describe('terminator helpers', () => {
  it('uses a 100 km earth-scale half width for the day-night transition', () => {
    expect(getTerminatorHalfWidthKilometers()).toBe(100);
    expect(getTerminatorHalfAngleRadians()).toBeCloseTo(100 / 6371, 8);
  });

  it('scales projected terminator width with the globe radius', () => {
    expect(getProjectedTerminatorHalfWidthPx(200)).toBeCloseTo(
      200 * (100 / 6371),
      8,
    );
  });
});
