import { geoCircle, geoRotation } from 'd3';
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

export function clampLatitudeRotation(value: number) {
  return Math.max(-85, Math.min(85, value));
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
    z: -Math.cos(lon) * cosLat,
  };
}

export function getRotatedSunDirection(rotation: [number, number]) {
  const [longitude, latitude] = getSunPosition();
  const rotate = geoRotation([rotation[0], rotation[1], 0]);
  const rotated = rotate([longitude, latitude]);
  return geoToSpherePosition(rotated[0], rotated[1]);
}

interface UseGlobeInteractionArgs {
  baseScale: number;
  focusRequest: number;
  rotation: [number, number];
  pointerDirection?: {
    x: 1 | -1;
    y: 1 | -1;
  };
}

export function useGlobeInteraction({
  baseScale,
  focusRequest,
  rotation,
  pointerDirection = { x: 1, y: 1 },
}: UseGlobeInteractionArgs) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [currentRotation, setCurrentRotation] = useState<[number, number]>(rotation);
  const animationFrameRef = useRef<number | null>(null);
  const animateRef = useRef<(now: number) => void>(() => undefined);
  const draggingRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastDragSampleRef = useRef({ timeStamp: 0, x: 0, y: 0 });
  const currentRotationRef = useRef<[number, number]>(rotation);
  const targetRotationRef = useRef<[number, number]>(rotation);
  const currentZoomRef = useRef(1);
  const targetZoomRef = useRef(1);
  const focusTargetRef = useRef<[number, number] | null>(null);
  const rotationVelocityRef = useRef({ latitude: 0, longitude: 0 });
  const zoomVelocityRef = useRef(0);

  useEffect(() => {
    currentRotationRef.current = currentRotation;
  }, [currentRotation]);

  useEffect(() => {
    currentZoomRef.current = zoomScale;
  }, [zoomScale]);

  const setAnimationState = useCallback((nextValue: boolean) => {
    if (isAnimatingRef.current === nextValue) {
      return;
    }

    isAnimatingRef.current = nextValue;
    setIsAnimating(nextValue);
  }, []);

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastFrameTimeRef.current = null;
    setAnimationState(false);
  }, [setAnimationState]);

  function animate(now: number) {
    const previousFrameTime = lastFrameTimeRef.current ?? now;
    const frameScale = Math.min((now - previousFrameTime) / (1000 / 60), 4);
    lastFrameTimeRef.current = now;

    if (!draggingRef.current) {
      if (focusTargetRef.current) {
        const focusTarget = focusTargetRef.current;
        targetRotationRef.current = [
          interpolateAngle(targetRotationRef.current[0], focusTarget[0], 0.18 * frameScale),
          clampLatitudeRotation(
            targetRotationRef.current[1] +
              (focusTarget[1] - targetRotationRef.current[1]) * 0.18 * frameScale,
          ),
        ];

        const longitudeError = Math.abs(
          normalizeLongitude(focusTarget[0] - targetRotationRef.current[0]),
        );
        const latitudeError = Math.abs(focusTarget[1] - targetRotationRef.current[1]);

        if (longitudeError < 0.1 && latitudeError < 0.1) {
          targetRotationRef.current = focusTarget;
          focusTargetRef.current = null;
        }
      }

      targetRotationRef.current = [
        normalizeLongitude(
          targetRotationRef.current[0] +
            rotationVelocityRef.current.longitude * frameScale,
        ),
        clampLatitudeRotation(
          targetRotationRef.current[1] +
            rotationVelocityRef.current.latitude * frameScale,
        ),
      ];
      targetZoomRef.current = clampScale(
        targetZoomRef.current + zoomVelocityRef.current * frameScale,
      );

      const inertiaDecay = 0.9 ** frameScale;
      rotationVelocityRef.current.longitude *= inertiaDecay;
      rotationVelocityRef.current.latitude *= inertiaDecay;
      zoomVelocityRef.current *= 0.82 ** frameScale;
    }

    const positionLerp = 1 - 0.12 ** frameScale;
    const nextRotation: [number, number] = [
      interpolateAngle(
        currentRotationRef.current[0],
        targetRotationRef.current[0],
        positionLerp,
      ),
      clampLatitudeRotation(
        currentRotationRef.current[1] +
          (targetRotationRef.current[1] - currentRotationRef.current[1]) * positionLerp,
      ),
    ];
    const nextZoom =
      currentZoomRef.current +
      (targetZoomRef.current - currentZoomRef.current) * (1 - 0.16 ** frameScale);

    currentRotationRef.current = nextRotation;
    currentZoomRef.current = nextZoom;
    setCurrentRotation(nextRotation);
    setZoomScale(nextZoom);

    const rotationSettled =
      Math.abs(normalizeLongitude(targetRotationRef.current[0] - nextRotation[0])) < 0.01 &&
      Math.abs(targetRotationRef.current[1] - nextRotation[1]) < 0.01;
    const zoomSettled = Math.abs(targetZoomRef.current - nextZoom) < 0.001;
    const velocitySettled =
      Math.abs(rotationVelocityRef.current.longitude) < 0.001 &&
      Math.abs(rotationVelocityRef.current.latitude) < 0.001 &&
      Math.abs(zoomVelocityRef.current) < 0.0005;

    if (
      draggingRef.current ||
      focusTargetRef.current ||
      !rotationSettled ||
      !zoomSettled ||
      !velocitySettled
    ) {
      animationFrameRef.current = requestAnimationFrame((frameNow) => {
        animateRef.current(frameNow);
      });
    } else {
      animationFrameRef.current = null;
      lastFrameTimeRef.current = null;
      setAnimationState(false);
    }
  }

  useEffect(() => {
    animateRef.current = animate;
  });

  const startAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      return;
    }

    setAnimationState(true);
    animationFrameRef.current = requestAnimationFrame((now) => {
      animateRef.current(now);
    });
  }, [setAnimationState]);

  const onPointerDown = useCallback(
    <T extends Element>(event: ReactPointerEvent<T>) => {
      focusTargetRef.current = null;
      rotationVelocityRef.current = { latitude: 0, longitude: 0 };
      draggingRef.current = true;
      targetRotationRef.current = currentRotationRef.current;
      lastDragSampleRef.current = {
        timeStamp: event.timeStamp,
        x: event.clientX,
        y: event.clientY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      startAnimation();
    },
    [startAnimation],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<Element>) => {
      if (!draggingRef.current) {
        return;
      }

      const sensitivity = 75 / (baseScale * targetZoomRef.current);
      const deltaX = event.clientX - lastDragSampleRef.current.x;
      const deltaY = event.clientY - lastDragSampleRef.current.y;
      const deltaTime = Math.max(event.timeStamp - lastDragSampleRef.current.timeStamp, 1);
      const longitudeDelta = deltaX * sensitivity * pointerDirection.x;
      const latitudeDelta = -deltaY * sensitivity * pointerDirection.y;

      targetRotationRef.current = [
        normalizeLongitude(targetRotationRef.current[0] + longitudeDelta),
        clampLatitudeRotation(
          targetRotationRef.current[1] + latitudeDelta,
        ),
      ];
      rotationVelocityRef.current = {
        latitude: latitudeDelta / (deltaTime / (1000 / 60)),
        longitude: longitudeDelta / (deltaTime / (1000 / 60)),
      };
      lastDragSampleRef.current = {
        timeStamp: event.timeStamp,
        x: event.clientX,
        y: event.clientY,
      };
      startAnimation();
    },
    [baseScale, pointerDirection.x, pointerDirection.y, startAnimation],
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
      startAnimation();
    },
    [startAnimation],
  );

  const onWheel = useCallback(
    (event: ReactWheelEvent<Element>) => {
      event.preventDefault();
      focusTargetRef.current = null;
      targetZoomRef.current = clampScale(targetZoomRef.current - event.deltaY * 0.001);
      zoomVelocityRef.current = Math.max(
        -0.16,
        Math.min(0.16, zoomVelocityRef.current - event.deltaY * 0.00018),
      );
      startAnimation();
    },
    [startAnimation],
  );

  useEffect(() => {
    if (draggingRef.current) {
      return;
    }

    focusTargetRef.current = [rotation[0], rotation[1]];
    targetRotationRef.current = currentRotationRef.current;
    rotationVelocityRef.current = { latitude: 0, longitude: 0 };

    const frameId = window.requestAnimationFrame(() => {
      startAnimation();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [focusRequest, rotation, startAnimation]);

  useEffect(() => stopAnimation, [stopAnimation]);

  return {
    currentRotation,
    interactionHandlers: {
      onPointerDown,
      onPointerLeave: onPointerUp,
      onPointerMove,
      onPointerUp,
      onWheel,
    },
    isAnimating,
    zoomScale,
  };
}
