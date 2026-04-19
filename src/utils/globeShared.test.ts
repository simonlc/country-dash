import { act, renderHook, waitFor } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { describe, expect, it } from 'vitest';
import {
  getCountryHighlightRings,
  getProjectedTerminatorHalfWidthPx,
  getTerminatorHalfAngleRadians,
  getTerminatorHalfWidthKilometers,
  getTwilightHalfAngleRadians,
  getTwilightHalfWidthKilometers,
  useGlobeInteraction,
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

function createPointerTarget() {
  const capturedPointers = new Set<number>();

  return {
    hasPointerCapture(pointerId: number) {
      return capturedPointers.has(pointerId);
    },
    releasePointerCapture(pointerId: number) {
      capturedPointers.delete(pointerId);
    },
    setPointerCapture(pointerId: number) {
      capturedPointers.add(pointerId);
    },
  };
}

function createPointerEvent(args: {
  clientX: number;
  clientY: number;
  currentTarget: ReturnType<typeof createPointerTarget>;
  pointerId: number;
  timeStamp: number;
}) {
  return {
    ...args,
  } as unknown as ReactPointerEvent<Element>;
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

  it('uses a broader earth-scale twilight band for the visible day-night falloff', () => {
    expect(getTwilightHalfAngleRadians()).toBeCloseTo((6 * Math.PI) / 180, 8);
    expect(getTwilightHalfWidthKilometers()).toBeCloseTo(
      6371 * ((6 * Math.PI) / 180),
      6,
    );
  });
});

describe('useGlobeInteraction', () => {
  it('keeps a drag active after pointer leave events', async () => {
    const { result } = renderHook(() =>
      useGlobeInteraction({
        baseScale: 200,
        focusRequest: 0,
        rotation: [0, 0],
      }),
    );
    const target = createPointerTarget();

    act(() => {
      result.current.interactionHandlers.onPointerDown(
        createPointerEvent({
          clientX: 100,
          clientY: 100,
          currentTarget: target,
          pointerId: 1,
          timeStamp: 1,
        }),
      );
      result.current.interactionHandlers.onPointerMove(
        createPointerEvent({
          clientX: 140,
          clientY: 100,
          currentTarget: target,
          pointerId: 1,
          timeStamp: 17,
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.currentRotation[0]).not.toBe(0);
    });
    const rotationAfterFirstMove = result.current.currentRotation[0];
    const interactionHandlersWithLeave = result.current.interactionHandlers as {
      onPointerLeave?: (event: ReactPointerEvent<Element>) => void;
    };

    act(() => {
      interactionHandlersWithLeave.onPointerLeave?.(
        createPointerEvent({
          clientX: 140,
          clientY: 100,
          currentTarget: target,
          pointerId: 1,
          timeStamp: 18,
        }),
      );
      result.current.interactionHandlers.onPointerMove(
        createPointerEvent({
          clientX: 180,
          clientY: 100,
          currentTarget: target,
          pointerId: 1,
          timeStamp: 34,
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.currentRotation[0]).toBeGreaterThan(
        rotationAfterFirstMove,
      );
    });
  });
});
