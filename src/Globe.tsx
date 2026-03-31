import {
  geoCircle,
  geoCentroid,
  geoGraticule10,
  geoLength,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from 'd3';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import * as solar from 'solar-calculator';
import type { CountryFeature, FeatureCollectionLike } from '@/features/game/types';

interface GlobeProps {
  country: CountryFeature;
  width: number;
  height: number;
  rotation: [number, number];
  world: FeatureCollectionLike;
  world110m: FeatureCollectionLike;
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

export function Globe({
  country,
  width,
  height,
  rotation,
  world,
  world110m,
}: GlobeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  const projection = useMemo(() => {
    const initialScale = Math.max(Math.min(width, height) / 2 - 10, 1);
    return geoOrthographic()
      .scale(initialScale * zoomScale)
      .center([0, 0])
      .rotate([rotation[0], rotation[1]])
      .translate([width / 2, height / 2]);
  }, [height, rotation, width, zoomScale]);

  const targetFeature = useMemo(
    () => world.features.find((feature) => feature.id === country.id) ?? country,
    [country, world.features],
  );

  const countrySize = useMemo(() => geoLength(targetFeature), [targetFeature]);

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

    const render = () => {
      const path = geoPath(projection, context);
      const graticule = geoGraticule10();
      const selectedCircle = geoCircle()
        .center(geoCentroid(country))
        .radius(1);
      const dataset = world110m.features.length > 0 ? world110m : world;

      context.clearRect(0, 0, width, height);
      context.fillStyle = colors.hazeOuter;
      context.fillRect(0, 0, width, height);

      const haze = context.createRadialGradient(
        width / 3,
        height / 3,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.85,
      );
      haze.addColorStop(0, colors.hazeInner);
      haze.addColorStop(1, colors.hazeOuter);
      context.globalAlpha = 0.6;
      context.fillStyle = haze;
      context.beginPath();
      context.arc(width / 2, height / 2, Math.max(width, height), 0, tau);
      context.fill();
      context.globalAlpha = 1;

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
      path(dataset as GeoPermissibleObjects);
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
        path(selectedCircle());
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

    render();

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startRotation: [number, number, number] = [
      projection.rotate()[0],
      projection.rotate()[1],
      projection.rotate()[2],
    ];

    const handlePointerDown = (event: PointerEvent) => {
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      const current = projection.rotate();
      startRotation = [current[0], current[1], current[2]];
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }

      const sensitivity = 75 / projection.scale();
      projection.rotate([
        startRotation[0] + (event.clientX - startX) * sensitivity,
        startRotation[1] - (event.clientY - startY) * sensitivity,
        startRotation[2],
      ]);
      render();
    };

    const stopDragging = (event: PointerEvent) => {
      if (dragging) {
        dragging = false;
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const nextScale = clampScale(zoomScale - event.deltaY * 0.001);
      if (nextScale === zoomScale) {
        return;
      }
      setZoomScale(nextScale);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', stopDragging);
    canvas.addEventListener('pointerleave', stopDragging);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', stopDragging);
      canvas.removeEventListener('pointerleave', stopDragging);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [country, countrySize, height, projection, width, world, world110m, zoomScale, targetFeature]);

  return <div ref={rootRef} style={styles.root} />;
}
