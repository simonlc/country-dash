import { describe, expect, it } from 'vitest';
import type { CipherTrafficTrack } from '@/hooks/useCipherTraffic';
import {
  cipherTrafficQueryBounds,
  normalizeLongitude,
  selectDiverseTrafficTracks,
} from '@/hooks/useCipherTraffic';

function createTrack(args: {
  icao24: string;
  latitude: number;
  longitude: number;
  samples?: number;
  timestampMs?: number;
  velocity?: number;
}): CipherTrafficTrack {
  const {
    icao24,
    latitude,
    longitude,
    samples = 3,
    timestampMs = 1_700_000_000_000,
    velocity = 240,
  } = args;

  return {
    callsign: null,
    category: 4,
    icao24,
    lastContactMs: timestampMs,
    originCountry: null,
    samples: Array.from({ length: samples }, (_, index) => ({
      altitude: 11_000,
      heading: 90,
      latitude,
      longitude,
      timestampMs: timestampMs - (samples - index) * 30_000,
      velocity,
    })),
  };
}

describe('useCipherTraffic helpers', () => {
  it('keeps cipher traffic queries global', () => {
    expect(cipherTrafficQueryBounds).toEqual({
      lamax: 84,
      lamin: -72,
      lomax: 180,
      lomin: -180,
    });
  });

  it('normalizes longitudes into the visible world range', () => {
    expect(normalizeLongitude(190)).toBe(-170);
    expect(normalizeLongitude(-181)).toBe(179);
    expect(normalizeLongitude(45)).toBe(45);
  });

  it('prefers geographically diverse tracks before filling leftovers', () => {
    const tracks = [
      createTrack({ icao24: 'alpha', latitude: 12, longitude: 12 }),
      createTrack({ icao24: 'bravo', latitude: 15, longitude: 14 }),
      createTrack({ icao24: 'charlie', latitude: -28, longitude: 92 }),
      createTrack({ icao24: 'delta', latitude: 51, longitude: -118 }),
    ];

    const selected = selectDiverseTrafficTracks(tracks, 3);

    expect(selected.map((track) => track.icao24)).toEqual([
      'alpha',
      'charlie',
      'delta',
    ]);
  });

  it('fills remaining slots with the next best tracks after the diversity pass', () => {
    const tracks = [
      createTrack({ icao24: 'alpha', latitude: 12, longitude: 12 }),
      createTrack({ icao24: 'bravo', latitude: 15, longitude: 14 }),
      createTrack({ icao24: 'charlie', latitude: -28, longitude: 92 }),
    ];

    const selected = selectDiverseTrafficTracks(tracks, 4);

    expect(selected.map((track) => track.icao24)).toEqual([
      'alpha',
      'charlie',
      'bravo',
    ]);
  });
});
