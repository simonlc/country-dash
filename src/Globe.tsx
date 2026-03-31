import {
  geoCircle,
  geoCentroid,
  geoGraticule10,
  geoLength,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from 'd3';
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import * as solar from 'solar-calculator';
import type { CountryFeature, FeatureCollectionLike } from '@/features/game/types';

interface GlobeProps {
  country: CountryFeature;
  width: number;
  height: number;
  rotation: [number, number];
  focusRequest: number;
  world: FeatureCollectionLike;
}

const styles: Record<'root', CSSProperties> = {
  root: {
    width: '100%',
    height: '100%',
  },
};

const colors = {
  oceanFill: '#dcefff',
  graticule: 'rgba(0, 0, 0, 0.12)',
  countryFill: '#9fc2a8',
  countryStroke: 'rgba(0, 0, 0, 0.35)',
  selectedFill: '#ffbc42',
  hazeOuter: '#eaf4ff',
  hazeInner: '#9ed8ff',
  nightShade: 'rgba(0, 0, 0, 0.18)',
  smallCountryCircle: 'rgba(217, 74, 51, 0.95)',
};

const tau = 2 * Math.PI;
const sphere: GeoPermissibleObjects = { type: 'Sphere' };

function blurredCircular(
  context: CanvasRenderingContext2D,
  operation: () => void,
  radius: number,
  step = 0.18,
) {
  const offsetRadius = radius / 2;
  const alpha = context.globalAlpha;
  context.globalAlpha = alpha * step * 1.4;

  for (let angle = 0; angle < 1; angle += step) {
    const x = offsetRadius * Math.cos(angle * tau);
    const y = offsetRadius * Math.sin(angle * tau);
    context.translate(x, y);
    operation();
    context.translate(-x, -y);
  }

  context.globalAlpha = alpha;
}

function getSunPosition(): [number, number] {
  const now = new Date();
  const day = new Date(now.getTime()).setUTCHours(0, 0, 0, 0);
  const century = solar.century(now);
  const longitude = ((day - now.getTime()) / 864e5) * 360 - 180;
  return [
    longitude - solar.equationOfTime(century) / 4,
    solar.declination(century),
  ];
}

function createNightCircle() {
  const [longitude, latitude] = getSunPosition();
  return geoCircle().radius(90).center([longitude + 180, -latitude]);
}

function clampScale(value: number) {
  return Math.min(20, Math.max(0.35, value));
}

function normalizeLongitude(value: number) {
  return ((((value + 180) % 360) + 360) % 360) - 180;
}

function interpolateAngle(from: number, to: number, progress: number) {
  const delta = normalizeLongitude(to - from);
  return normalizeLongitude(from + delta * progress);
}

export function Globe({
  country,
  width,
  height,
  rotation,
  focusRequest,
  world,
}: GlobeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const renderFrameRef = useRef<number | null>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const isDraggingRef = useRef(false);
  const zoomScaleRef = useRef(1);
  const currentRotationRef = useRef<[number, number, number]>([
    rotation[0],
    rotation[1],
    0,
  ]);
  const baseScale = useMemo(
    () => Math.max(Math.min(width, height) / 2 - 10, 1),
    [height, width],
  );
  const projection = useMemo(
    () =>
      geoOrthographic()
        .scale(baseScale)
        .center([0, 0])
        .translate([width / 2, height / 2]),
    [baseScale, height, width],
  );

  const targetFeature = useMemo(
    () => world.features.find((feature) => feature.id === country.id) ?? country,
    [country, world.features],
  );
  const countrySize = useMemo(() => geoLength(targetFeature), [targetFeature]);
  const selectedCircle = useMemo(
    () => geoCircle().center(geoCentroid(targetFeature)).radius(1)(),
    [targetFeature],
  );
  const graticule = useMemo(() => geoGraticule10(), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || width <= 0 || height <= 0) {
      return;
    }

    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      root.appendChild(canvas);
      canvasRef.current = canvas;
      contextRef.current = canvas.getContext('2d');
    }

    const canvas = canvasRef.current;
    const context = contextRef.current;

    if (!canvas || !context) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);

    projection
      .translate([width / 2, height / 2])
      .scale(baseScale * zoomScaleRef.current)
      .rotate(currentRotationRef.current);

    const path = geoPath(projection, context);
    const hazeCanvas = document.createElement('canvas');
    hazeCanvas.width = width * dpr;
    hazeCanvas.height = height * dpr;
    const hazeContext = hazeCanvas.getContext('2d');

    if (!hazeContext) {
      return;
    }

    hazeContext.setTransform(1, 0, 0, 1, 0, 0);
    hazeContext.scale(dpr, dpr);

    const haze = hazeContext.createRadialGradient(
      width / 3,
      height / 3,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.85,
    );
    haze.addColorStop(0, colors.hazeInner);
    haze.addColorStop(1, colors.hazeOuter);

    hazeContext.fillStyle = colors.hazeOuter;
    hazeContext.fillRect(0, 0, width, height);
    hazeContext.globalAlpha = 0.6;
    hazeContext.fillStyle = haze;
    hazeContext.beginPath();
    hazeContext.arc(width / 2, height / 2, Math.max(width, height), 0, tau);
    hazeContext.fill();
    hazeContext.globalAlpha = 1;

    const render = () => {
      context.clearRect(0, 0, width, height);
      context.drawImage(hazeCanvas, 0, 0, width, height);

      context.beginPath();
      path(sphere);
      context.fillStyle = colors.oceanFill;
      context.fill();

      context.beginPath();
      path(graticule);
      context.strokeStyle = colors.graticule;
      context.lineWidth = 0.8;
      context.stroke();

      context.beginPath();
      path(world as GeoPermissibleObjects);
      context.fillStyle = colors.countryFill;
      context.strokeStyle = colors.countryStroke;
      context.lineWidth = 0.8;
      context.fill();
      context.stroke();

      context.beginPath();
      path(targetFeature);
      context.fillStyle = colors.selectedFill;
      context.strokeStyle = colors.countryStroke;
      context.lineWidth = 1;
      context.fill();
      context.stroke();

      if (countrySize < 0.02) {
        context.beginPath();
        path(selectedCircle);
        context.strokeStyle = colors.smallCountryCircle;
        context.lineWidth = 2;
        context.stroke();
      }

      const nightCircle = createNightCircle();
      context.save();
      context.beginPath();
      path(sphere);
      context.clip();
      blurredCircular(
        context,
        () => {
          context.beginPath();
          path(nightCircle());
          context.fillStyle = colors.nightShade;
          context.fill();
        },
        10,
      );
      context.restore();
    };

    renderRef.current = render;
    render();

    const scheduleRender = () => {
      if (renderFrameRef.current !== null) {
        return;
      }

      renderFrameRef.current = requestAnimationFrame(() => {
        renderFrameRef.current = null;
        render();
      });
    };

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startRotation = currentRotationRef.current;

    const handlePointerDown = (event: PointerEvent) => {
      dragging = true;
      isDraggingRef.current = true;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      startX = event.clientX;
      startY = event.clientY;
      startRotation = currentRotationRef.current;
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }

      const sensitivity = 75 / projection.scale();
      currentRotationRef.current = [
        startRotation[0] + (event.clientX - startX) * sensitivity,
        startRotation[1] - (event.clientY - startY) * sensitivity,
        startRotation[2],
      ];
      projection.rotate(currentRotationRef.current);
      scheduleRender();
    };

    const stopDragging = (event: PointerEvent) => {
      if (dragging) {
        dragging = false;
        isDraggingRef.current = false;
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const nextScale = clampScale(zoomScaleRef.current - event.deltaY * 0.001);
      if (nextScale === zoomScaleRef.current) {
        return;
      }
      zoomScaleRef.current = nextScale;
      projection.scale(baseScale * nextScale);
      scheduleRender();
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', stopDragging);
    canvas.addEventListener('pointerleave', stopDragging);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      renderRef.current = null;
      if (renderFrameRef.current !== null) {
        cancelAnimationFrame(renderFrameRef.current);
        renderFrameRef.current = null;
      }
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', stopDragging);
      canvas.removeEventListener('pointerleave', stopDragging);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [
    baseScale,
    countrySize,
    graticule,
    height,
    projection,
    selectedCircle,
    targetFeature,
    width,
    world,
  ]);

  useEffect(() => {
    projection.rotate(currentRotationRef.current);
    renderRef.current?.();
  }, [projection]);

  useEffect(() => {
    if (isDraggingRef.current) {
      return;
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const startRotation = currentRotationRef.current;
    const targetRotation: [number, number, number] = [rotation[0], rotation[1], 0];
    const durationMs = 650;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const easedProgress = 1 - (1 - progress) ** 3;

      currentRotationRef.current = [
        interpolateAngle(startRotation[0], targetRotation[0], easedProgress),
        startRotation[1] + (targetRotation[1] - startRotation[1]) * easedProgress,
        0,
      ];
      projection.rotate(currentRotationRef.current);
      renderRef.current?.();

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
  }, [focusRequest, projection, rotation]);

  return <div ref={rootRef} style={styles.root} />;
}
