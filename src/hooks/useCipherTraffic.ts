import { useMemo } from 'react';
import sampleTrafficData from '@/data/cipher-traffic-sample.json';

export interface CipherTrafficSample {
  altitude: number | null;
  heading: number | null;
  latitude: number;
  longitude: number;
  timestampMs: number;
  velocity: number | null;
}

export interface CipherTrafficTrack {
  callsign: string | null;
  category: number | null;
  icao24: string;
  lastContactMs: number;
  originCountry: string | null;
  samples: CipherTrafficSample[];
}

export interface CipherTrafficState {
  cacheAgeMs: number | null;
  errorMessage: string | null;
  source: 'cache' | 'disabled' | 'error' | 'live' | 'loading';
  status: 'disabled' | 'error' | 'live' | 'loading';
  tracks: CipherTrafficTrack[];
  updatedAtMs: number | null;
}

interface CipherTrafficApiState {
  baroAltitude: number | null;
  callsign: string | null;
  category: number | null;
  icao24: string;
  lastContact: number | null;
  latitude: number | null;
  longitude: number | null;
  onGround: boolean;
  originCountry: string | null;
  trueTrack: number | null;
  velocity: number | null;
}

interface CipherTrafficApiResponse {
  meta?: {
    cacheAgeMs?: number | null;
    cached?: boolean;
  };
  states: CipherTrafficApiState[];
  time: number | null;
}

interface UseCipherTrafficArgs {
  enabled: boolean;
  endpoint: string | null;
}

const allowedCipherCategories = new Set([4, 5, 6]);
const maxReturnedTracks = 128;
const diversityLatitudeBucketSize = 20;
const diversityLongitudeBucketSize = 30;

export const cipherTrafficQueryBounds = {
  lamax: 84,
  lamin: -72,
  lomax: 180,
  lomin: -180,
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeLongitude(value: number) {
  let normalized = value;
  while (normalized < -180) {
    normalized += 360;
  }
  while (normalized > 180) {
    normalized -= 360;
  }
  return normalized;
}

function getLatestSample(track: CipherTrafficTrack) {
  return track.samples[track.samples.length - 1] ?? null;
}

function getTrackDiversityBucket(track: CipherTrafficTrack) {
  const latestSample = getLatestSample(track);
  if (!latestSample) {
    return 'unknown';
  }

  const latitudeBucket = Math.floor(
    clamp(latestSample.latitude + 90, 0, 180 - Number.EPSILON) /
      diversityLatitudeBucketSize,
  );
  const longitudeBucket = Math.floor(
    (normalizeLongitude(latestSample.longitude) + 180) /
      diversityLongitudeBucketSize,
  );

  return `${latitudeBucket}:${longitudeBucket}`;
}

function compareTracks(left: CipherTrafficTrack, right: CipherTrafficTrack) {
  const latestLeft = getLatestSample(left);
  const latestRight = getLatestSample(right);
  const sampleDelta = right.samples.length - left.samples.length;
  if (Math.abs(sampleDelta) > 1) {
    return sampleDelta;
  }

  const recencyDelta =
    (latestRight?.timestampMs ?? 0) - (latestLeft?.timestampMs ?? 0);
  if (Math.abs(recencyDelta) > 5000) {
    return recencyDelta;
  }

  const speedDelta = (latestRight?.velocity ?? 0) - (latestLeft?.velocity ?? 0);
  if (Math.abs(speedDelta) > 0.001) {
    return speedDelta;
  }

  const altitudeDelta =
    (latestRight?.altitude ?? 0) - (latestLeft?.altitude ?? 0);
  if (Math.abs(altitudeDelta) > 1) {
    return altitudeDelta;
  }

  return left.icao24.localeCompare(right.icao24);
}

export function selectDiverseTrafficTracks(
  tracks: CipherTrafficTrack[],
  limit: number,
) {
  const buckets = new Map<string, CipherTrafficTrack[]>();

  for (const track of tracks) {
    const bucket = getTrackDiversityBucket(track);
    const bucketTracks = buckets.get(bucket);
    if (bucketTracks) {
      bucketTracks.push(track);
    } else {
      buckets.set(bucket, [track]);
    }
  }

  const bucketEntries = [...buckets.values()].sort((left, right) =>
    compareTracks(left[0]!, right[0]!),
  );
  const selected: CipherTrafficTrack[] = [];

  while (selected.length < limit) {
    let addedInPass = false;

    for (const bucketTracks of bucketEntries) {
      const nextTrack = bucketTracks.shift();
      if (!nextTrack) {
        continue;
      }

      selected.push(nextTrack);
      addedInPass = true;

      if (selected.length >= limit) {
        return selected;
      }
    }

    if (!addedInPass) {
      break;
    }
  }

  return selected;
}

function buildTrafficTracks(response: CipherTrafficApiResponse) {
  const sampleTimeMs = (response.time ?? Math.floor(Date.now() / 1000)) * 1000;

  return response.states
    .filter(
      (state) =>
        Boolean(state.icao24) &&
        state.latitude !== null &&
        state.longitude !== null &&
        !state.onGround &&
        (state.category === null ||
          allowedCipherCategories.has(state.category)),
    )
    .map((state) => {
      const sampleTimestampMs =
        (state.lastContact ?? response.time ?? 0) * 1000 || sampleTimeMs;

      return {
        callsign: state.callsign,
        category: state.category,
        icao24: state.icao24,
        lastContactMs: sampleTimestampMs,
        originCountry: state.originCountry,
        samples: [
          {
            altitude: state.baroAltitude,
            heading: state.trueTrack,
            latitude: state.latitude!,
            longitude: state.longitude!,
            timestampMs: sampleTimestampMs,
            velocity: state.velocity,
          },
        ],
      } satisfies CipherTrafficTrack;
    })
    .sort(compareTracks);
}

const sampleCipherTrafficResponse = sampleTrafficData as CipherTrafficApiResponse;
const mockCipherTrafficTracks = selectDiverseTrafficTracks(
  buildTrafficTracks(sampleCipherTrafficResponse),
  maxReturnedTracks,
);
const mockTrafficUpdatedAtMs =
  sampleCipherTrafficResponse.time !== null
    ? sampleCipherTrafficResponse.time * 1000
    : Date.now();

const mockCipherTrafficState: CipherTrafficState = {
  cacheAgeMs: null,
  errorMessage: null,
  source: 'cache',
  status: 'live',
  tracks: mockCipherTrafficTracks,
  updatedAtMs: mockTrafficUpdatedAtMs,
};

const disabledCipherTrafficState: CipherTrafficState = {
  cacheAgeMs: null,
  errorMessage: null,
  source: 'disabled',
  status: 'disabled',
  tracks: [],
  updatedAtMs: null,
};

export function useCipherTraffic({
  enabled,
}: UseCipherTrafficArgs): CipherTrafficState {
  return useMemo(
    () => (enabled ? mockCipherTrafficState : disabledCipherTrafficState),
    [enabled],
  );
}
