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

interface CipherTrafficBounds {
  lamin: number;
  lamax: number;
  lomin: number;
  lomax: number;
}

interface CipherTrafficFocus {
  latitude: number;
  longitude: number;
}

interface UseCipherTrafficArgs {
  enabled: boolean;
  endpoint: string | null;
  getViewRotation: () => [number, number];
}

const allowedCipherCategories = new Set([4, 5, 6]);
const historyWindowMs = 10 * 60 * 1000;
const pollIntervalMs = 26 * 1000;
const hiddenPollIntervalMs = 75 * 1000;
const maxReturnedTracks = 24;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeLongitude(value: number) {
  let normalized = value;
  while (normalized < -180) {
    normalized += 360;
  }
  while (normalized > 180) {
    normalized -= 360;
  }
  return normalized;
}

function getCipherTrafficBounds(rotation: [number, number]): CipherTrafficBounds {
  const centerLongitude = normalizeLongitude(-rotation[0]);
  const centerLatitude = clamp(-rotation[1], -72, 72);
  const latitudeSpan = 42;
  const longitudeSpan = Math.min(
    96,
    70 / Math.max(Math.cos((Math.abs(centerLatitude) * Math.PI) / 180), 0.32),
  );
  const lamin = clamp(centerLatitude - latitudeSpan, -85, 85);
  const lamax = clamp(centerLatitude + latitudeSpan, -85, 85);
  const lomin = centerLongitude - longitudeSpan;
  const lomax = centerLongitude + longitudeSpan;

  if (lomin < -180 || lomax > 180) {
    return {
      lamin,
      lamax,
      lomin: -180,
      lomax: 180,
    };
  }

  return {
    lamin,
    lamax,
    lomin,
    lomax,
  };
}

function buildCipherTrafficUrl(
  endpoint: string,
  rotation: [number, number],
) {
  const url = new URL(endpoint, window.location.origin);
  const bounds = getCipherTrafficBounds(rotation);
  url.searchParams.set('extended', '1');
  url.searchParams.set('lamin', bounds.lamin.toFixed(4));
  url.searchParams.set('lamax', bounds.lamax.toFixed(4));
  url.searchParams.set('lomin', bounds.lomin.toFixed(4));
  url.searchParams.set('lomax', bounds.lomax.toFixed(4));
  url.searchParams.set('categories', '4,5,6');
  url.searchParams.set('limit', String(maxReturnedTracks));
  return url.toString();
}

function getTrafficFocus(rotation: [number, number]): CipherTrafficFocus {
  return {
    latitude: clamp(-rotation[1], -78, 78),
    longitude: normalizeLongitude(-rotation[0]),
  };
}

function getAngularDistanceDegrees(
  left: CipherTrafficFocus,
  right: CipherTrafficFocus,
) {
  const leftLatitude = (left.latitude * Math.PI) / 180;
  const rightLatitude = (right.latitude * Math.PI) / 180;
  const longitudeDelta =
    ((normalizeLongitude(left.longitude - right.longitude) * Math.PI) / 180);
  const cosine =
    Math.sin(leftLatitude) * Math.sin(rightLatitude) +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.cos(longitudeDelta);

  return (Math.acos(clamp(cosine, -1, 1)) * 180) / Math.PI;
}

function mergeTrafficTracks(
  previousTracks: CipherTrafficTrack[],
  response: CipherTrafficApiResponse,
  focus: CipherTrafficFocus,
) {
  const sampleTimeMs = (response.time ?? Math.floor(Date.now() / 1000)) * 1000;
  const mergedTracks = new Map(
    previousTracks.map((track) => [track.icao24, track] as const),
  );

  for (const state of response.states) {
    if (
      !state.icao24 ||
      state.latitude === null ||
      state.longitude === null ||
      state.onGround ||
      (state.category !== null && !allowedCipherCategories.has(state.category))
    ) {
      continue;
    }

    const lastContactMs = (state.lastContact ?? response.time ?? 0) * 1000;
    const nextSample: CipherTrafficSample = {
      altitude: state.baroAltitude,
      heading: state.trueTrack,
      latitude: state.latitude,
      longitude: state.longitude,
      timestampMs: lastContactMs || sampleTimeMs,
      velocity: state.velocity,
    };

    const previous = mergedTracks.get(state.icao24);
    const samples = previous?.samples ?? [];
    const lastSample = samples[samples.length - 1];
    const nextSamples =
      lastSample &&
      lastSample.timestampMs === nextSample.timestampMs &&
      Math.abs(lastSample.latitude - nextSample.latitude) < 0.0001 &&
      Math.abs(lastSample.longitude - nextSample.longitude) < 0.0001
        ? samples
        : [...samples, nextSample];
    const prunedSamples = nextSamples.filter(
      (sample) => sample.timestampMs >= sampleTimeMs - historyWindowMs,
    );

    mergedTracks.set(state.icao24, {
      callsign: state.callsign,
      category: state.category,
      icao24: state.icao24,
      lastContactMs,
      originCountry: state.originCountry,
      samples: prunedSamples,
    });
  }

  return [...mergedTracks.values()]
    .filter(
      (track) =>
        track.samples.length > 0 &&
        track.lastContactMs >= sampleTimeMs - historyWindowMs,
    )
    .sort((left, right) => {
      const latestLeft = left.samples[left.samples.length - 1];
      const latestRight = right.samples[right.samples.length - 1];
      const distanceLeft =
        latestLeft === undefined
          ? Number.POSITIVE_INFINITY
          : getAngularDistanceDegrees(focus, {
              latitude: latestLeft.latitude,
              longitude: latestLeft.longitude,
            });
      const distanceRight =
        latestRight === undefined
          ? Number.POSITIVE_INFINITY
          : getAngularDistanceDegrees(focus, {
              latitude: latestRight.latitude,
              longitude: latestRight.longitude,
            });
      const visibilityBucketLeft = Math.floor(distanceLeft / 18);
      const visibilityBucketRight = Math.floor(distanceRight / 18);
      const visibilityDelta = visibilityBucketLeft - visibilityBucketRight;
      if (visibilityDelta !== 0) {
        return visibilityDelta;
      }
      const sampleDelta = right.samples.length - left.samples.length;
      if (Math.abs(sampleDelta) > 1) {
        return sampleDelta;
      }
      const recencyDelta =
        (latestRight?.timestampMs ?? 0) - (latestLeft?.timestampMs ?? 0);
      if (Math.abs(recencyDelta) > 5000) {
        return recencyDelta;
      }
      const distanceDelta = distanceLeft - distanceRight;
      if (Math.abs(distanceDelta) > 0.75) {
        return distanceDelta;
      }
      const speedDelta = (latestRight?.velocity ?? 0) - (latestLeft?.velocity ?? 0);
      if (Math.abs(speedDelta) > 0.001) {
        return speedDelta;
      }
      return left.icao24.localeCompare(right.icao24);
    })
    .slice(0, maxReturnedTracks);
}

export function useCipherTraffic({
  enabled,
  endpoint,
  getViewRotation,
}: UseCipherTrafficArgs): CipherTrafficState {
  const [state, setState] = useState<CipherTrafficState>({
    cacheAgeMs: null,
    errorMessage: null,
    source: enabled && endpoint ? 'loading' : 'disabled',
    status: enabled && endpoint ? 'loading' : 'disabled',
    tracks: [],
    updatedAtMs: null,
  });
  const resolvedEndpoint = useMemo(
    () => endpoint?.trim() || null,
    [endpoint],
  );

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
    let timeoutId = 0;
    let previousTracks: CipherTrafficTrack[] = [];

    const poll = async () => {
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

      try {
        if (document.visibilityState === 'hidden') {
          return;
        }

        const rotation = getViewRotation();
        const url = buildCipherTrafficUrl(resolvedEndpoint, rotation);
        const response = await fetch(url, {
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
        const merged = mergeTrafficTracks(
          previousTracks,
          payload,
          getTrafficFocus(rotation),
        );
        previousTracks = merged;

        if (!cancelled) {
          setState({
            cacheAgeMs:
              typeof payload.meta?.cacheAgeMs === 'number'
                ? payload.meta.cacheAgeMs
                : null,
            errorMessage: null,
            source: payload.meta?.cached ? 'cache' : 'live',
            status: 'live',
            tracks: merged,
            updatedAtMs:
              payload.time !== null ? payload.time * 1000 : Date.now(),
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState((current) => ({
            cacheAgeMs: current.cacheAgeMs,
            errorMessage:
              error instanceof Error ? error.message : 'Traffic feed unavailable.',
            source: 'error',
            status: 'error',
            tracks: current.tracks,
            updatedAtMs: current.updatedAtMs,
          }));
        }
      } finally {
        if (!cancelled) {
          timeoutId = window.setTimeout(() => {
            void poll();
          }, document.visibilityState === 'hidden' ? hiddenPollIntervalMs : pollIntervalMs);
        }
      }
    };

    void poll();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [enabled, getViewRotation, resolvedEndpoint]);

  return state;
}
