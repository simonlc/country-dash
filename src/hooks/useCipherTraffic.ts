import { useEffect, useMemo, useState } from 'react';

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

interface CachedCipherTrafficSnapshot {
  endpoint: string;
  fetchedAtMs: number;
  state: CipherTrafficState;
}

let cachedSnapshot: CachedCipherTrafficSnapshot | null = null;
let pendingSnapshotRequest: Promise<CachedCipherTrafficSnapshot> | null = null;
let pendingSnapshotEndpoint: string | null = null;

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

function buildCipherTrafficUrl(endpoint: string) {
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set('extended', '1');
  url.searchParams.set('lamin', String(cipherTrafficQueryBounds.lamin));
  url.searchParams.set('lamax', String(cipherTrafficQueryBounds.lamax));
  url.searchParams.set('lomin', String(cipherTrafficQueryBounds.lomin));
  url.searchParams.set('lomax', String(cipherTrafficQueryBounds.lomax));
  url.searchParams.set('categories', '4,5,6');
  url.searchParams.set('limit', String(maxReturnedTracks));
  return url.toString();
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

function resolveCachedSnapshot(endpoint: string): CipherTrafficState | null {
  if (!cachedSnapshot || cachedSnapshot.endpoint !== endpoint) {
    return null;
  }

  return {
    cacheAgeMs: Date.now() - cachedSnapshot.fetchedAtMs,
    errorMessage: null,
    source: 'cache',
    status: 'live',
    tracks: cachedSnapshot.state.tracks,
    updatedAtMs: cachedSnapshot.state.updatedAtMs,
  };
}

async function fetchCipherTrafficSnapshot(endpoint: string) {
  if (pendingSnapshotRequest && pendingSnapshotEndpoint === endpoint) {
    return pendingSnapshotRequest;
  }

  pendingSnapshotEndpoint = endpoint;
  pendingSnapshotRequest = (async () => {
    const response = await fetch(buildCipherTrafficUrl(endpoint), {
      headers: {
        Accept: 'application/json',
      },
    });
    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json')) {
      throw new Error(
        'Traffic relay returned HTML instead of JSON. Restart the dev server so the OpenSky relay route is active.',
      );
    }

    if (!response.ok) {
      const payload = (await response.json()) as {
        error?: string;
      };
      throw new Error(
        payload.error ?? `Traffic feed returned ${response.status}.`,
      );
    }

    const payload = (await response.json()) as CipherTrafficApiResponse;
    const snapshot = {
      endpoint,
      fetchedAtMs: Date.now(),
      state: {
        cacheAgeMs:
          typeof payload.meta?.cacheAgeMs === 'number'
            ? payload.meta.cacheAgeMs
            : null,
        errorMessage: null,
        source: payload.meta?.cached ? 'cache' : 'live',
        status: 'live',
        tracks: selectDiverseTrafficTracks(
          buildTrafficTracks(payload),
          maxReturnedTracks,
        ),
        updatedAtMs: payload.time !== null ? payload.time * 1000 : Date.now(),
      } satisfies CipherTrafficState,
    } satisfies CachedCipherTrafficSnapshot;

    cachedSnapshot = snapshot;
    return snapshot;
  })().finally(() => {
    pendingSnapshotRequest = null;
    pendingSnapshotEndpoint = null;
  });

  return pendingSnapshotRequest;
}

export function useCipherTraffic({
  enabled,
  endpoint,
}: UseCipherTrafficArgs): CipherTrafficState {
  const [state, setState] = useState<CipherTrafficState>({
    cacheAgeMs: null,
    errorMessage: null,
    source: enabled && endpoint ? 'loading' : 'disabled',
    status: enabled && endpoint ? 'loading' : 'disabled',
    tracks: [],
    updatedAtMs: null,
  });
  const resolvedEndpoint = useMemo(() => endpoint?.trim() || null, [endpoint]);

  useEffect(() => {
    if (!enabled || !resolvedEndpoint) {
      setState({
        cacheAgeMs: null,
        errorMessage: null,
        source: 'disabled',
        status: 'disabled',
        tracks: [],
        updatedAtMs: null,
      });
      return;
    }

    let cancelled = false;
    const nextCachedState = resolveCachedSnapshot(resolvedEndpoint);
    if (nextCachedState) {
      setState(nextCachedState);
      return () => {
        cancelled = true;
      };
    }

    setState((current) =>
      current.tracks.length > 0
        ? current
        : {
            ...current,
            cacheAgeMs: null,
            errorMessage: null,
            source: 'loading',
            status: 'loading',
          },
    );

    void fetchCipherTrafficSnapshot(resolvedEndpoint)
      .then((snapshot) => {
        if (!cancelled) {
          setState(snapshot.state);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState((current) => ({
            cacheAgeMs: current.cacheAgeMs,
            errorMessage:
              error instanceof Error
                ? error.message
                : 'Traffic feed unavailable.',
            source: 'error',
            status: 'error',
            tracks: current.tracks,
            updatedAtMs: current.updatedAtMs,
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, resolvedEndpoint]);

  return state;
}
