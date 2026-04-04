import {
  geoCircle,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from 'd3';
import type {
  GlobePalette,
  GlobeQualityConfig,
  GlobeRenderConfig,
} from '@/app/theme';
import type { CipherTrafficState } from '@/hooks/useCipherTraffic';
import type { CountryFeature, GameMode } from '@/types/game';
import {
  drawCipherCountryTransitionOverlay,
  drawCipherMapAnnotations,
  drawCipherSelectedCountryOverlay,
  drawCipherTrafficOverlay,
  type CipherCountryTransition,
  type CipherCriticalSite,
} from '@/utils/globeCipherOverlays';
import { drawCipherHydroOverlay, type HydroFeatureCollection } from '@/utils/globeHydroOverlays';
import { getCountryHighlightRings } from '@/utils/globeShared';

const selectedOverlayInsetPx = 0.35;

export function drawSelectedCountryOverlay(args: {
  canvas: HTMLCanvasElement;
  criticalSites: CipherCriticalSite[];
  country: CountryFeature;
  currentRotation: [number, number];
  height: number;
  lakesData: HydroFeatureCollection | null;
  mode: GameMode;
  nowMs: number;
  palette: GlobePalette;
  quality: GlobeQualityConfig;
  render: GlobeRenderConfig;
  riversData: HydroFeatureCollection | null;
  trafficState: CipherTrafficState;
  transition: CipherCountryTransition | null;
  width: number;
  zoomScale: number;
}) {
  const {
    canvas,
    criticalSites,
    country,
    currentRotation,
    height,
    lakesData,
    mode,
    nowMs,
    palette,
    quality,
    render,
    riversData,
    trafficState,
    transition,
    width,
    zoomScale,
  } = args;
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = Math.max(Math.floor(width * dpr), 1);
  const targetHeight = Math.max(Math.floor(height * dpr), 1);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.scale(dpr, dpr);

  const globeRadius = Math.max(Math.min(width, height) * 0.45 * zoomScale, 1);
  const projection = geoOrthographic()
    .scale(Math.max(globeRadius - selectedOverlayInsetPx, 1))
    .center([0, 0])
    .translate([width / 2, height / 2])
    .rotate([currentRotation[0], currentRotation[1], 0]);
  const path = geoPath(projection, context);

  context.save();
  context.beginPath();
  path({ type: 'Sphere' });
  context.clip();

  if (render.cipherHydroOverlayOpacity > 0) {
    context.save();
    context.globalAlpha *= render.cipherHydroOverlayOpacity;
    drawCipherHydroOverlay({
      context,
      height,
      lakesData,
      nowMs,
      path,
      projection,
      quality,
      riversData,
      width,
    });
    context.restore();
  }

  if (render.cipherTrafficOverlayOpacity > 0) {
    context.save();
    context.globalAlpha *= render.cipherTrafficOverlayOpacity;
    drawCipherTrafficOverlay({
      criticalSites,
      context,
      currentRotation,
      nowMs,
      palette,
      projection,
      trafficState,
    });
    context.restore();
  }

  if (mode === 'capitals') {
    if (
      typeof country.properties.capitalLongitude === 'number' &&
      typeof country.properties.capitalLatitude === 'number'
    ) {
      const capitalPoint = projection([
        country.properties.capitalLongitude,
        country.properties.capitalLatitude,
      ]);

      if (capitalPoint) {
        const [capitalX, capitalY] = capitalPoint;
        const cycleSeconds = 1.6;
        const elapsedSeconds = nowMs * 0.001;
        const waveProgress = (elapsedSeconds % cycleSeconds) / cycleSeconds;

        context.fillStyle = palette.smallCountryCircle;
        context.globalAlpha = 0.95;
        context.beginPath();
        context.arc(capitalX, capitalY, 3, 0, Math.PI * 2);
        context.fill();

        for (let wave = 0; wave < 2; wave += 1) {
          const phase = (waveProgress + wave * 0.5) % 1;
          const radius = 4 + phase * 28;
          const alpha = Math.max(0, 0.6 * (1 - phase));

          context.beginPath();
          context.arc(capitalX, capitalY, radius, 0, Math.PI * 2);
          context.strokeStyle = palette.smallCountryCircle;
          context.globalAlpha = alpha;
          context.lineWidth = 2 - phase * 0.8;
          context.stroke();
        }
      }
    }
  } else {
    let usedSpecialSelectionOverlay = false;

    if (render.cipherSelectedCountryOverlayOpacity > 0) {
      context.save();
      context.globalAlpha *= render.cipherSelectedCountryOverlayOpacity;
      drawCipherSelectedCountryOverlay({
        context,
        country,
        nowMs,
        palette,
        path,
        projection,
      });
      context.restore();
      usedSpecialSelectionOverlay = true;
    }

    if (render.cipherCountryTransitionOpacity > 0 && transition) {
      context.save();
      context.globalAlpha *= render.cipherCountryTransitionOpacity;
      drawCipherCountryTransitionOverlay({
        context,
        nowMs,
        palette,
        path,
        projection,
        transition,
      });
      context.restore();
      usedSpecialSelectionOverlay = true;
    }

    if (!usedSpecialSelectionOverlay) {
      const ringPaths = getCountryHighlightRings(country).map((ring) =>
        geoCircle().center(ring.center).radius(ring.radius)(),
      );

      context.beginPath();
      path(country as GeoPermissibleObjects);
      context.fillStyle = palette.selectedFill;
      context.strokeStyle = palette.selectedFill;
      context.globalAlpha = 0.9;
      context.lineWidth = 0.18;
      context.fill();
      context.stroke();
      context.globalAlpha = 1;

      context.strokeStyle = palette.smallCountryCircle;
      context.lineWidth = 1.7;
      for (const ringPath of ringPaths) {
        context.beginPath();
        path(ringPath);
        context.stroke();
      }
    }
  }

  if (render.cipherMapAnnotationsOpacity > 0) {
    context.save();
    context.globalAlpha *= render.cipherMapAnnotationsOpacity;
    drawCipherMapAnnotations({
      context,
      country,
      height,
      nowMs,
      palette,
      projection,
      width,
    });
    context.restore();
  }

  context.globalAlpha = 1;
  context.restore();
}
