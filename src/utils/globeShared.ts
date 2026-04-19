import { geoArea, geoCentroid, geoCircle, geoLength, geoRotation } from 'd3';
import type { GeoPermissibleObjects } from 'd3';
import type { Feature, Polygon } from 'geojson';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import * as solar from 'solar-calculator';
import type {
  CountryFeature,
  FeatureCollectionLike,
  GameMode,
} from '@/types/game';

export interface GlobeViewProps {
  country: CountryFeature;
  mode: GameMode;
  width: number;
  height: number;
  roundIndex: number;
  rotation: [number, number];
  focusRequest: number;
  world: FeatureCollectionLike;
}

export const tau = 2 * Math.PI;
export const earthRadiusKm = 6371;
export const terminatorHalfWidthKilometers = 100;
export const civilTwilightDegrees = 6;

export function getTerminatorHalfAngleRadians() {
  return terminatorHalfWidthKilometers / earthRadiusKm;
}

export function getTerminatorHalfWidthKilometers() {
  return terminatorHalfWidthKilometers;
}

export function getTwilightHalfAngleRadians() {
  return (civilTwilightDegrees * Math.PI) / 180;
}

export function getTwilightHalfWidthKilometers() {
  return earthRadiusKm * getTwilightHalfAngleRadians();
}

export function getProjectedTerminatorHalfWidthPx(globeRadiusPx: number) {
  return globeRadiusPx * getTerminatorHalfAngleRadians();
}

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

interface CountryHighlightRing {
  center: [number, number];
  radius: number;
}

const compactCountryPerimeterThreshold = 0.02;
const fragmentedCountryPartThreshold = 3;
const fragmentedCountryAreaThreshold = 0.00008;
const fragmentedCountryLargestPartThreshold = 0.00003;
const fragmentedCountryMaxRings = 3;

function clampHighlightRadius(area: number, fallbackRadius: number) {
  return Math.max(0.8, Math.min(2.2, fallbackRadius + Math.sqrt(area) * 220));
}

function toPolygonFeatures(country: CountryFeature): Array<Feature<Polygon>> {
  if (country.geometry.type === 'Polygon') {
    return [
      {
        type: 'Feature',
        geometry: country.geometry,
        properties: {},
      },
    ];
  }

  if (country.geometry.type === 'MultiPolygon') {
    return country.geometry.coordinates.map((coordinates) => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates,
      },
      properties: {},
    }));
  }

  return [];
}

export function getCountryHighlightRings(
  country: CountryFeature,
): CountryHighlightRing[] {
  if (geoLength(country) < compactCountryPerimeterThreshold) {
    return [
      {
        center: geoCentroid(country as GeoPermissibleObjects),
        radius: 1,
      },
    ];
  }

  const polygonFeatures = toPolygonFeatures(country);
  if (polygonFeatures.length < fragmentedCountryPartThreshold) {
    return [];
  }

  const totalArea = geoArea(country as GeoPermissibleObjects);
  const polygonMetrics = polygonFeatures
    .map((feature) => ({
      area: geoArea(feature as GeoPermissibleObjects),
      center: geoCentroid(feature as GeoPermissibleObjects),
    }))
    .sort((left, right) => right.area - left.area);
  const largestPartArea = polygonMetrics[0]?.area ?? 0;

  if (
    totalArea >= fragmentedCountryAreaThreshold ||
    largestPartArea >= fragmentedCountryLargestPartThreshold
  ) {
    return [];
  }

  return polygonMetrics
    .filter((metric) => metric.area >= totalArea * 0.08)
    .slice(0, fragmentedCountryMaxRings)
    .map((metric) => ({
      center: metric.center,
      radius: clampHighlightRadius(metric.area, 0.85),
    }));
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
  focusDelayMs?: number;
  focusDelayKey?: number | string | null;
  focusRequest: number;
  initialZoomScale?: number;
  onFrame?: (frame: {
    rotation: [number, number];
    zoomScale: number;
  }) => void;
  rotation: [number, number];
  pointerDirection?: {
    x: 1 | -1;
    y: 1 | -1;
  };
  useStateUpdates?: boolean;
}

interface PointerSample {
  timeStamp: number;
  x: number;
  y: number;
}

interface PinchSample {
  centerX: number;
  centerY: number;
  distance: number;
}

function getPinchSample(
  activePointers: Map<number, PointerSample>,
): PinchSample | null {
  if (activePointers.size < 2) {
    return null;
  }

  const samples = Array.from(activePointers.values());
  const firstSample = samples[0];
  const secondSample = samples[1];
  if (!firstSample || !secondSample) {
    return null;
  }

  return {
    centerX: (firstSample.x + secondSample.x) / 2,
    centerY: (firstSample.y + secondSample.y) / 2,
    distance: Math.hypot(
      secondSample.x - firstSample.x,
      secondSample.y - firstSample.y,
    ),
  };
}

export function useGlobeInteraction({
  baseScale,
  focusDelayMs = 0,
  focusDelayKey = null,
  focusRequest,
  initialZoomScale = 1,
  onFrame,
  rotation,
  pointerDirection = { x: 1, y: 1 },
  useStateUpdates = true,
}: UseGlobeInteractionArgs) {
  const normalizedInitialZoomScale = clampScale(initialZoomScale);
  const [isAnimating, setIsAnimating] = useState(false);
  const [zoomScale, setZoomScale] = useState(normalizedInitialZoomScale);
  const [currentRotation, setCurrentRotation] = useState<[number, number]>(rotation);
  const animationFrameRef = useRef<number | null>(null);
  const animateRef = useRef<(now: number) => void>(() => undefined);
  const activePointersRef = useRef(new Map<number, PointerSample>());
  const draggingRef = useRef(false);
  const focusDelayTimeoutRef = useRef<number | null>(null);
  const lastFocusDelayKeyRef = useRef<number | string | null>(focusDelayKey);
  const isAnimatingRef = useRef(false);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastDragSampleRef = useRef({ timeStamp: 0, x: 0, y: 0 });
  const pinchSampleRef = useRef<PinchSample | null>(null);
  const currentRotationRef = useRef<[number, number]>(rotation);
  const targetRotationRef = useRef<[number, number]>(rotation);
  const currentZoomRef = useRef(normalizedInitialZoomScale);
  const targetZoomRef = useRef(normalizedInitialZoomScale);
  const focusTargetRef = useRef<[number, number] | null>(null);
  const onFrameRef = useRef(onFrame);
  const rotationVelocityRef = useRef({ latitude: 0, longitude: 0 });
  const zoomVelocityRef = useRef(0);

  useEffect(() => {
    currentRotationRef.current = currentRotation;
  }, [currentRotation]);

  useEffect(() => {
    currentZoomRef.current = zoomScale;
  }, [zoomScale]);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

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
    if (focusDelayTimeoutRef.current !== null) {
      window.clearTimeout(focusDelayTimeoutRef.current);
      focusDelayTimeoutRef.current = null;
    }
    activePointersRef.current.clear();
    draggingRef.current = false;
    pinchSampleRef.current = null;
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
    if (useStateUpdates) {
      setCurrentRotation(nextRotation);
      setZoomScale(nextZoom);
    }
    onFrameRef.current?.({
      rotation: nextRotation,
      zoomScale: nextZoom,
    });

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
      const pointerSample = {
        timeStamp: event.timeStamp,
        x: event.clientX,
        y: event.clientY,
      };
      activePointersRef.current.set(event.pointerId, pointerSample);
      if ('setPointerCapture' in event.currentTarget) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }

      const pinchSample = getPinchSample(activePointersRef.current);
      if (pinchSample) {
        draggingRef.current = false;
        pinchSampleRef.current = pinchSample;
        targetRotationRef.current = currentRotationRef.current;
        targetZoomRef.current = currentZoomRef.current;
        zoomVelocityRef.current = 0;
        startAnimation();
        return;
      }

      pinchSampleRef.current = null;
      draggingRef.current = true;
      targetRotationRef.current = currentRotationRef.current;
      lastDragSampleRef.current = pointerSample;
      startAnimation();
    },
    [startAnimation],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<Element>) => {
      if (!activePointersRef.current.has(event.pointerId)) {
        return;
      }

      activePointersRef.current.set(event.pointerId, {
        timeStamp: event.timeStamp,
        x: event.clientX,
        y: event.clientY,
      });

      const nextPinchSample = getPinchSample(activePointersRef.current);
      if (nextPinchSample) {
        const previousPinchSample = pinchSampleRef.current ?? nextPinchSample;
        const previousDistance = Math.max(previousPinchSample.distance, 1);
        const zoomScaleRatio = nextPinchSample.distance / previousDistance;
        const pinchPanSensitivity = 75 / (baseScale * targetZoomRef.current);
        const deltaCenterX = nextPinchSample.centerX - previousPinchSample.centerX;
        const deltaCenterY = nextPinchSample.centerY - previousPinchSample.centerY;
        const longitudeDelta = deltaCenterX * pinchPanSensitivity * pointerDirection.x;
        const latitudeDelta = -deltaCenterY * pinchPanSensitivity * pointerDirection.y;

        targetRotationRef.current = [
          normalizeLongitude(targetRotationRef.current[0] + longitudeDelta),
          clampLatitudeRotation(targetRotationRef.current[1] + latitudeDelta),
        ];
        rotationVelocityRef.current = {
          latitude: latitudeDelta,
          longitude: longitudeDelta,
        };

        if (Number.isFinite(zoomScaleRatio) && zoomScaleRatio > 0) {
          targetZoomRef.current = clampScale(
            targetZoomRef.current * zoomScaleRatio,
          );
          zoomVelocityRef.current = Math.max(
            -0.2,
            Math.min(
              0.2,
              (nextPinchSample.distance - previousDistance) * 0.012,
            ),
          );
        }

        pinchSampleRef.current = nextPinchSample;
        draggingRef.current = false;
        startAnimation();
        return;
      }

      pinchSampleRef.current = null;
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
      if (
        'hasPointerCapture' in event.currentTarget &&
        event.currentTarget.hasPointerCapture(event.pointerId)
      ) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      activePointersRef.current.delete(event.pointerId);
      const remainingPointers = Array.from(activePointersRef.current.values());
      const nextDragPointer = remainingPointers[0];

      if (nextDragPointer) {
        draggingRef.current = true;
        pinchSampleRef.current = null;
        targetRotationRef.current = currentRotationRef.current;
        lastDragSampleRef.current = nextDragPointer;
      } else {
        draggingRef.current = false;
        pinchSampleRef.current = null;
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

    if (focusDelayTimeoutRef.current !== null) {
      window.clearTimeout(focusDelayTimeoutRef.current);
      focusDelayTimeoutRef.current = null;
    }

    let frameId: number | null = null;
    const shouldDelayFocus =
      focusDelayMs > 0 &&
      focusDelayKey !== null &&
      lastFocusDelayKeyRef.current !== focusDelayKey;
    const scheduleFocus = () => {
      focusTargetRef.current = [rotation[0], rotation[1]];
      targetRotationRef.current = currentRotationRef.current;
      rotationVelocityRef.current = { latitude: 0, longitude: 0 };
      lastFocusDelayKeyRef.current = focusDelayKey;
      frameId = window.requestAnimationFrame(() => {
        startAnimation();
      });
    };

    if (shouldDelayFocus) {
      focusTargetRef.current = null;
      targetRotationRef.current = currentRotationRef.current;
      rotationVelocityRef.current = { latitude: 0, longitude: 0 };
      focusDelayTimeoutRef.current = window.setTimeout(() => {
        focusDelayTimeoutRef.current = null;
        scheduleFocus();
      }, focusDelayMs);
    } else {
      lastFocusDelayKeyRef.current = focusDelayKey;
      scheduleFocus();
    }

    return () => {
      if (focusDelayTimeoutRef.current !== null) {
        window.clearTimeout(focusDelayTimeoutRef.current);
        focusDelayTimeoutRef.current = null;
      }
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [focusDelayKey, focusDelayMs, focusRequest, rotation, startAnimation]);

  useEffect(() => stopAnimation, [stopAnimation]);

  return {
    currentRotation,
    interactionHandlers: {
      onPointerDown,
      onPointerCancel: onPointerUp,
      onPointerMove,
      onPointerUp,
      onWheel,
    },
    isAnimating,
    zoomScale,
  };
}
