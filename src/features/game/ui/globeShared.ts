import { geoCircle } from 'd3';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import * as solar from 'solar-calculator';
import type { CountryFeature, FeatureCollectionLike } from '@/features/game/types';

export interface GlobeViewProps {
  country: CountryFeature;
  width: number;
  height: number;
  rotation: [number, number];
  focusRequest: number;
  world: FeatureCollectionLike;
}

export const tau = 2 * Math.PI;

export function clampScale(value: number) {
  return Math.min(20, Math.max(0.35, value));
}

export function normalizeLongitude(value: number) {
  return ((((value + 180) % 360) + 360) % 360) - 180;
}

export function interpolateAngle(from: number, to: number, progress: number) {
  const delta = normalizeLongitude(to - from);
  return normalizeLongitude(from + delta * progress);
}

export function getSunPosition(): [number, number] {
  const now = new Date();
  const day = new Date(now.getTime()).setUTCHours(0, 0, 0, 0);
  const century = solar.century(now);
  const longitude = ((day - now.getTime()) / 864e5) * 360 - 180;
  return [
    longitude - solar.equationOfTime(century) / 4,
    solar.declination(century),
  ];
}

export function createNightCircle() {
  const [longitude, latitude] = getSunPosition();
  return geoCircle().radius(90).center([longitude + 180, -latitude])();
}

export function geoToSpherePosition(longitude: number, latitude: number) {
  const lon = (longitude * Math.PI) / 180;
  const lat = (latitude * Math.PI) / 180;
  const cosLat = Math.cos(lat);

  return {
    x: Math.sin(lon) * cosLat,
    y: Math.sin(lat),
    z: Math.cos(lon) * cosLat,
  };
}

function multiplyMat3Vec3(
  matrix: [number, number, number, number, number, number, number, number, number],
  vector: { x: number; y: number; z: number },
) {
  return {
    x: matrix[0] * vector.x + matrix[1] * vector.y + matrix[2] * vector.z,
    y: matrix[3] * vector.x + matrix[4] * vector.y + matrix[5] * vector.z,
    z: matrix[6] * vector.x + matrix[7] * vector.y + matrix[8] * vector.z,
  };
}

export function getRotationMatrix(
  rotation: [number, number],
): [number, number, number, number, number, number, number, number, number] {
  const y = (rotation[0] * Math.PI) / 180;
  const x = (-rotation[1] * Math.PI) / 180;

  const cy = Math.cos(y);
  const sy = Math.sin(y);
  const cx = Math.cos(x);
  const sx = Math.sin(x);

  return [
    cy,
    0,
    sy,
    sx * sy,
    cx,
    -sx * cy,
    -cx * sy,
    sx,
    cx * cy,
  ];
}

export function getRotatedSunDirection(rotation: [number, number]) {
  const [longitude, latitude] = getSunPosition();
  return multiplyMat3Vec3(
    getRotationMatrix(rotation),
    geoToSpherePosition(longitude, latitude),
  );
}

interface UseGlobeInteractionArgs {
  baseScale: number;
  focusRequest: number;
  rotation: [number, number];
}

export function useGlobeInteraction({
  baseScale,
  focusRequest,
  rotation,
}: UseGlobeInteractionArgs) {
  const [zoomScale, setZoomScale] = useState(1);
  const [currentRotation, setCurrentRotation] = useState<[number, number]>(rotation);
  const animationFrameRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });
  const startRotationRef = useRef<[number, number]>(rotation);
  const latestRotationRef = useRef<[number, number]>(rotation);

  useEffect(() => {
    latestRotationRef.current = currentRotation;
  }, [currentRotation]);

  const onPointerDown = useCallback(
    <T extends Element>(event: ReactPointerEvent<T>) => {
      draggingRef.current = true;
      startPointRef.current = { x: event.clientX, y: event.clientY };
      startRotationRef.current = latestRotationRef.current;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<Element>) => {
      if (!draggingRef.current) {
        return;
      }

      const sensitivity = 75 / (baseScale * zoomScale);
      setCurrentRotation([
        startRotationRef.current[0] +
          (event.clientX - startPointRef.current.x) * sensitivity,
        startRotationRef.current[1] -
          (event.clientY - startPointRef.current.y) * sensitivity,
      ]);
    },
    [baseScale, zoomScale],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<Element>) => {
      if (!draggingRef.current) {
        return;
      }

      draggingRef.current = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  const onWheel = useCallback((event: ReactWheelEvent<Element>) => {
    event.preventDefault();
    setZoomScale((value) => clampScale(value - event.deltaY * 0.001));
  }, []);

  useEffect(() => {
    if (draggingRef.current) {
      return;
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const startRotation = latestRotationRef.current;
    const targetRotation: [number, number] = [rotation[0], rotation[1]];
    const durationMs = 650;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const easedProgress = 1 - (1 - progress) ** 3;

      setCurrentRotation([
        interpolateAngle(startRotation[0], targetRotation[0], easedProgress),
        startRotation[1] + (targetRotation[1] - startRotation[1]) * easedProgress,
      ]);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [focusRequest, rotation]);

  return {
    currentRotation,
    interactionHandlers: {
      onPointerDown,
      onPointerLeave: onPointerUp,
      onPointerMove,
      onPointerUp,
      onWheel,
    },
    zoomScale,
  };
}
