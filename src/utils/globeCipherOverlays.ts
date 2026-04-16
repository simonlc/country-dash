import {
  geoCircle,
  geoCentroid,
  geoInterpolate,
  geoPath,
  geoRotation,
  type GeoProjection,
  type GeoPermissibleObjects,
} from 'd3';
import type { GlobePalette } from '@/app/theme';
import type {
  CipherTrafficSample,
  CipherTrafficState,
  CipherTrafficTrack,
} from '@/hooks/useCipherTraffic';
import { m } from '@/paraglide/messages.js';
import type { CountryFeature } from '@/types/game';
import { shiftColor, withOpacity } from '@/utils/globeColors';
import {
  geoToSpherePosition,
  getCountryHighlightRings,
} from '@/utils/globeShared';

export interface CipherCriticalSite {
  id: string;
  kind: 'power' | 'water';
  latitude: number;
  longitude: number;
  name: string;
  source: string;
}

export interface CipherCountryTransition {
  fromCountry: CountryFeature;
  key: string;
  startedAtMs: number;
  toCountry: CountryFeature;
}

export const cipherCountryTransitionDurationMs = 2400;

function isCipherCriticalSites(
  value: Array<object> | object | null,
): value is CipherCriticalSite[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      const candidate = item as Partial<CipherCriticalSite>;
      return (
        typeof candidate.id === 'string' &&
        (candidate.kind === 'power' || candidate.kind === 'water') &&
        typeof candidate.latitude === 'number' &&
        typeof candidate.longitude === 'number' &&
        typeof candidate.name === 'string' &&
        typeof candidate.source === 'string'
      );
    })
  );
}

export async function loadCipherCriticalSites(path: string) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load critical sites: ${path}`);
  }

  const data = (await response.json()) as Array<object> | object | null;
  if (!isCipherCriticalSites(data)) {
    throw new Error(`Invalid critical sites file: ${path}`);
  }

  return data;
}

export function getProjectedDestination(args: {
  distanceKm: number;
  headingDegrees: number;
  latitude: number;
  longitude: number;
}) {
  const earthRadiusKm = 6371;
  const angularDistance = args.distanceKm / earthRadiusKm;
  const startLat = (args.latitude * Math.PI) / 180;
  const startLon = (args.longitude * Math.PI) / 180;
  const heading = (args.headingDegrees * Math.PI) / 180;

  const destinationLat = Math.asin(
    Math.sin(startLat) * Math.cos(angularDistance) +
      Math.cos(startLat) * Math.sin(angularDistance) * Math.cos(heading),
  );
  const destinationLon =
    startLon +
    Math.atan2(
      Math.sin(heading) * Math.sin(angularDistance) * Math.cos(startLat),
      Math.cos(angularDistance) - Math.sin(startLat) * Math.sin(destinationLat),
    );

  return [
    (((destinationLon * 180) / Math.PI + 540) % 360) - 180,
    (destinationLat * 180) / Math.PI,
  ] as const;
}

export function createGlobeVisibilityTester(currentRotation: [number, number]) {
  const rotate = geoRotation([currentRotation[0], currentRotation[1], 0]);

  return (longitude: number, latitude: number) => {
    const [rotatedLongitude, rotatedLatitude] = rotate([longitude, latitude]);
    const spherePosition = geoToSpherePosition(
      rotatedLongitude,
      rotatedLatitude,
    );
    return spherePosition.z <= 0.015;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function clampLatitude(value: number) {
  return clamp(value, -85, 85);
}

function wrapLongitude(value: number) {
  return ((((value + 180) % 360) + 360) % 360) - 180;
}

function getCountryCenter(country: CountryFeature) {
  const center = geoCentroid(country as GeoPermissibleObjects);
  return [center[0], center[1]] as [number, number];
}

function buildCipherRouteCoordinates(args: {
  from: [number, number];
  latitudeSkew: number;
  longitudeSkew: number;
  to: [number, number];
}) {
  const { from, latitudeSkew, longitudeSkew, to } = args;
  const steps = 40;
  const interpolate = geoInterpolate(from, to);

  return Array.from({ length: steps }, (_, index) => {
    const progress = index / (steps - 1);
    const [longitude, latitude] = interpolate(progress);
    const sway = Math.sin(progress * Math.PI);

    return [
      wrapLongitude(longitude + longitudeSkew * sway),
      clampLatitude(latitude + latitudeSkew * sway),
    ] as [number, number];
  });
}

function interpolateRouteCoordinate(
  from: [number, number],
  to: [number, number],
  progress: number,
) {
  const longitudeDelta = wrapLongitude(to[0] - from[0]);
  return [
    wrapLongitude(from[0] + longitudeDelta * progress),
    clampLatitude(from[1] + (to[1] - from[1]) * progress),
  ] as [number, number];
}

function getRouteCoordinateAtProgress(
  coordinates: Array<[number, number]>,
  progress: number,
) {
  if (coordinates.length === 0) {
    return null;
  }

  if (coordinates.length === 1) {
    return coordinates[0]!;
  }

  const scaledIndex = clamp(progress, 0, 1) * (coordinates.length - 1);
  const startIndex = Math.floor(scaledIndex);
  const endIndex = Math.min(startIndex + 1, coordinates.length - 1);
  const segmentProgress = scaledIndex - startIndex;
  const start = coordinates[startIndex]!;
  const end = coordinates[endIndex]!;

  return interpolateRouteCoordinate(start, end, segmentProgress);
}

const cipherTrafficDisplayTimeScale = 28;
const cipherTrafficDisplayLoopMinutes = 240;

function getLatestSample(track: CipherTrafficTrack) {
  return track.samples[track.samples.length - 1] ?? null;
}

function getTrackDisplayPriority(track: CipherTrafficTrack) {
  const latestSample = getLatestSample(track);
  if (!latestSample) {
    return Number.NEGATIVE_INFINITY;
  }

  const freshness =
    1 -
    Math.min(
      Math.max(Date.now() - latestSample.timestampMs, 0),
      8 * 60 * 1000,
    ) /
      (8 * 60 * 1000);

  return (
    freshness * 4 +
    Math.min(track.samples.length, 12) * 0.45 +
    Math.min(Math.max(latestSample.velocity ?? 0, 0), 320) * 0.004
  );
}

function buildVisibleTrackList(args: {
  currentRotation: [number, number];
  nowMs: number;
  tracks: CipherTrafficTrack[];
}) {
  const { currentRotation, nowMs, tracks } = args;
  const isVisible = createGlobeVisibilityTester(currentRotation);

  return tracks
    .filter((track) => {
      const latestSample = getAnimatedCipherSample(track, nowMs);
      return (
        latestSample !== null &&
        isVisible(latestSample.longitude, latestSample.latitude)
      );
    })
    .sort(
      (left, right) =>
        getTrackDisplayPriority(right) - getTrackDisplayPriority(left),
    );
}

function getAnimatedCipherSample(
  track: CipherTrafficTrack,
  nowMs: number,
): CipherTrafficSample | null {
  const latestSample = getLatestSample(track);
  if (!latestSample) {
    return null;
  }

  if (
    typeof latestSample.heading !== 'number' ||
    typeof latestSample.velocity !== 'number' ||
    !Number.isFinite(latestSample.heading) ||
    !Number.isFinite(latestSample.velocity) ||
    latestSample.velocity < 70
  ) {
    return latestSample;
  }

  const elapsedMinutes =
    (Math.max(nowMs - latestSample.timestampMs, 0) / 60_000) *
    cipherTrafficDisplayTimeScale;
  const cycledMinutes = elapsedMinutes % cipherTrafficDisplayLoopMinutes;
  const distanceKm =
    clamp(latestSample.velocity, 165, 305) * 0.06 * cycledMinutes;
  const [longitude, latitude] = getProjectedDestination({
    distanceKm,
    headingDegrees: latestSample.heading,
    latitude: latestSample.latitude,
    longitude: latestSample.longitude,
  });

  return {
    ...latestSample,
    latitude,
    longitude,
    timestampMs: nowMs,
  };
}

function formatCipherTrackCallsign(track: CipherTrafficTrack) {
  return (track.callsign?.trim() || track.icao24).toUpperCase();
}

function formatCipherTrackVelocity(velocity: number | null) {
  if (typeof velocity !== 'number' || !Number.isFinite(velocity)) {
    return '--';
  }

  return String(Math.round(velocity * 1.94384));
}

export function drawCipherSelectedCountryOverlay(args: {
  context: CanvasRenderingContext2D;
  country: CountryFeature;
  nowMs: number;
  palette: GlobePalette;
  path: ReturnType<typeof geoPath>;
  projection: GeoProjection;
}) {
  const { context, country, nowMs, palette, path, projection } = args;
  const countryShape = country as GeoPermissibleObjects;
  const measurePath = geoPath(projection);
  const [[minX, minY], [maxX, maxY]] = measurePath.bounds(countryShape);
  const [centroidX, centroidY] = measurePath.centroid(countryShape);

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(maxY)
  ) {
    return;
  }

  const boundsWidth = Math.max(maxX - minX, 18);
  const boundsHeight = Math.max(maxY - minY, 18);
  const sweepProgress = (nowMs * 0.00012) % 1;
  const pulseProgress = (nowMs * 0.00072) % 1;
  const pulseAlpha = 1 - pulseProgress;
  const ringPaths = getCountryHighlightRings(country).map((ring) =>
    geoCircle().center(ring.center).radius(ring.radius)(),
  );

  context.save();
  context.beginPath();
  path(countryShape);
  context.clip();

  const baseFill = context.createLinearGradient(minX, minY, maxX, maxY);
  baseFill.addColorStop(0, withOpacity(palette.selectedFill, 0.16));
  baseFill.addColorStop(
    0.52,
    shiftColor(palette.selectedFill, -46, -8, -18, 0.08),
  );
  baseFill.addColorStop(1, withOpacity(palette.selectedFill, 0.14));
  context.fillStyle = baseFill;
  context.fillRect(minX - 6, minY - 6, boundsWidth + 12, boundsHeight + 12);

  context.globalCompositeOperation = 'screen';
  context.strokeStyle = withOpacity(palette.smallCountryCircle, 0.08);
  context.lineWidth = 1;
  const cellSpacing = Math.max(Math.min(boundsWidth, boundsHeight) / 5, 9);
  for (let x = minX - cellSpacing; x <= maxX + cellSpacing; x += cellSpacing) {
    context.beginPath();
    context.moveTo(x, minY - 4);
    context.lineTo(x, maxY + 4);
    context.stroke();
  }
  for (let y = minY - cellSpacing; y <= maxY + cellSpacing; y += cellSpacing) {
    context.beginPath();
    context.moveTo(minX - 4, y);
    context.lineTo(maxX + 4, y);
    context.stroke();
  }

  context.save();
  context.translate((minX + maxX) / 2, (minY + maxY) / 2);
  context.rotate(-0.24);
  const sweepX = -boundsWidth * 0.95 + sweepProgress * boundsWidth * 1.9;
  const sweepHalfWidth = Math.max(boundsWidth * 0.24, 18);
  const sweep = context.createLinearGradient(
    sweepX - sweepHalfWidth,
    0,
    sweepX + sweepHalfWidth,
    0,
  );
  sweep.addColorStop(0, withOpacity(palette.selectedFill, 0));
  sweep.addColorStop(0.42, withOpacity(palette.selectedFill, 0.03));
  sweep.addColorStop(0.5, withOpacity(palette.selectedFill, 0.22));
  sweep.addColorStop(0.58, withOpacity(palette.smallCountryCircle, 0.08));
  sweep.addColorStop(1, withOpacity(palette.selectedFill, 0));
  context.fillStyle = sweep;
  context.fillRect(
    -boundsWidth * 1.5,
    -boundsHeight * 1.9,
    boundsWidth * 3,
    boundsHeight * 3.8,
  );
  context.restore();
  context.restore();

  context.save();
  context.globalCompositeOperation = 'screen';
  context.shadowColor = withOpacity(palette.selectedFill, 0.46);
  context.shadowBlur = 12;
  context.strokeStyle = withOpacity(palette.selectedFill, 0.9);
  context.lineWidth = 1.7;
  context.beginPath();
  path(countryShape);
  context.stroke();
  context.restore();

  if (Number.isFinite(centroidX) && Number.isFinite(centroidY)) {
    context.save();
    context.globalCompositeOperation = 'screen';
    context.shadowColor = withOpacity(palette.selectedFill, 0.6);
    context.shadowBlur = 12;
    context.fillStyle = withOpacity(palette.selectedFill, 0.95);
    context.beginPath();
    context.arc(centroidX, centroidY, 2.6, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = withOpacity(palette.selectedFill, 0.38 * pulseAlpha);
    context.lineWidth = Math.max(0.8, 1.9 - pulseProgress);
    context.beginPath();
    context.arc(centroidX, centroidY, 7 + pulseProgress * 22, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  context.save();
  context.strokeStyle = withOpacity(
    palette.selectedFill,
    0.16 + pulseAlpha * 0.08,
  );
  context.lineWidth = 3.1 + pulseAlpha * 1.2;
  for (const ringPath of ringPaths) {
    context.beginPath();
    path(ringPath);
    context.stroke();
  }
  context.restore();

  context.save();
  context.globalCompositeOperation = 'screen';
  context.shadowColor = withOpacity(palette.smallCountryCircle, 0.28);
  context.shadowBlur = 10;
  context.strokeStyle = withOpacity(
    palette.smallCountryCircle,
    0.22 + pulseAlpha * 0.1,
  );
  context.setLineDash([8, 10]);
  context.lineDashOffset = -nowMs * 0.018;
  context.lineWidth = 1.3 + pulseAlpha * 0.7;
  for (const ringPath of ringPaths) {
    context.beginPath();
    path(ringPath);
    context.stroke();
  }
  context.restore();
}

export function drawCipherMapAnnotations(args: {
  context: CanvasRenderingContext2D;
  country: CountryFeature;
  height: number;
  nowMs: number;
  palette: GlobePalette;
  projection: GeoProjection;
  width: number;
}) {
  const { context, country, height, nowMs, palette, projection, width } = args;
  const countryShape = country as GeoPermissibleObjects;
  const measurePath = geoPath(projection);
  const [centroidX, centroidY] = measurePath.centroid(countryShape);
  const [[minX, minY], [maxX, maxY]] = measurePath.bounds(countryShape);

  if (
    !Number.isFinite(centroidX) ||
    !Number.isFinite(centroidY) ||
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(maxY)
  ) {
    return;
  }

  const labelWidth = Math.min(Math.max((maxX - minX) * 0.76, 140), 188);
  const labelHeight = 40;
  const placeOnRight = centroidX < width * 0.56;
  const anchorX = placeOnRight ? maxX + 26 : minX - 26;
  const leaderEndX = placeOnRight ? anchorX + 12 : anchorX - 12;
  const labelX = Math.max(
    12,
    Math.min(
      width - labelWidth - 12,
      placeOnRight ? anchorX + 14 : anchorX - labelWidth - 14,
    ),
  );
  const labelY = Math.max(
    12,
    Math.min(height - labelHeight - 12, centroidY - labelHeight * 0.5),
  );
  const blink = 0.5 + 0.5 * Math.sin(nowMs * 0.0048);

  context.save();
  context.globalCompositeOperation = 'screen';
  context.strokeStyle = withOpacity(palette.selectedFill, 0.5);
  context.lineWidth = 1.1;
  context.setLineDash([5, 7]);
  context.lineDashOffset = -nowMs * 0.012;
  context.beginPath();
  context.moveTo(centroidX, centroidY);
  context.lineTo(anchorX, labelY + labelHeight * 0.5);
  context.lineTo(leaderEndX, labelY + labelHeight * 0.5);
  context.stroke();

  context.setLineDash([]);
  context.fillStyle = 'rgba(3, 15, 17, 0.64)';
  context.strokeStyle = withOpacity(palette.smallCountryCircle, 0.22);
  context.lineWidth = 1;
  context.shadowColor = withOpacity(palette.smallCountryCircle, 0.16);
  context.shadowBlur = 12;
  context.beginPath();
  context.roundRect(labelX, labelY, labelWidth, labelHeight, 8);
  context.fill();
  context.stroke();

  context.shadowBlur = 0;
  context.fillStyle = withOpacity(palette.selectedFill, 0.92);
  context.font =
    '600 10px "IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
  context.fillText(
    `${m.cipher_overlay_lock_label()} // ${m.cipher_overlay_redacted_label()}`,
    labelX + 12,
    labelY + 15,
  );

  context.fillStyle = withOpacity('#f6ff9e', 0.94);
  context.font =
    '600 12px "IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
  context.fillText(`${m.cipher_overlay_visual_only()}`, labelX + 12, labelY + 30);

  context.fillStyle = withOpacity(palette.selectedFill, 0.28 + blink * 0.24);
  context.fillRect(labelX + labelWidth - 18, labelY + 11, 6, 6);
  context.restore();
}

export function drawCipherCountryTransitionOverlay(args: {
  context: CanvasRenderingContext2D;
  nowMs: number;
  palette: GlobePalette;
  path: ReturnType<typeof geoPath>;
  projection: GeoProjection;
  transition: CipherCountryTransition | null;
}) {
  const { context, nowMs, palette, path, projection, transition } = args;
  if (!transition) {
    return;
  }

  const progress = clamp(
    (nowMs - transition.startedAtMs) / cipherCountryTransitionDurationMs,
    0,
    1,
  );

  if (progress <= 0 || progress >= 1) {
    return;
  }

  const envelope = Math.sin(progress * Math.PI);
  const intro = clamp(progress / 0.18, 0, 1);
  const outro = clamp((1 - progress) / 0.22, 0, 1);
  const alpha = envelope * Math.min(intro + 0.1, 1) * Math.min(outro + 0.12, 1);
  const fromCenter = getCountryCenter(transition.fromCountry);
  const toCenter = getCountryCenter(transition.toCountry);
  const routeVariants = [
    {
      coordinates: buildCipherRouteCoordinates({
        from: fromCenter,
        latitudeSkew: 0,
        longitudeSkew: 0,
        to: toCenter,
      }),
      width: 1.9,
    },
    {
      coordinates: buildCipherRouteCoordinates({
        from: fromCenter,
        latitudeSkew: 2.8,
        longitudeSkew: 4.4,
        to: toCenter,
      }),
      width: 1.15,
    },
    {
      coordinates: buildCipherRouteCoordinates({
        from: fromCenter,
        latitudeSkew: -2.4,
        longitudeSkew: -3.8,
        to: toCenter,
      }),
      width: 1.05,
    },
  ] as const;
  const routePulse = 0.35 + 0.65 * envelope;
  const [globeCenterX, globeCenterY] = projection.translate();
  const globeRadius = projection.scale();
  const fieldGradient = context.createRadialGradient(
    globeCenterX,
    globeCenterY,
    globeRadius * 0.18,
    globeCenterX,
    globeCenterY,
    globeRadius * 1.08,
  );
  fieldGradient.addColorStop(0, withOpacity(palette.selectedFill, 0.02 * alpha));
  fieldGradient.addColorStop(0.56, withOpacity(palette.smallCountryCircle, 0.055 * alpha));
  fieldGradient.addColorStop(1, withOpacity(palette.selectedFill, 0));

  context.save();
  context.globalCompositeOperation = 'screen';
  context.fillStyle = fieldGradient;
  context.fillRect(
    globeCenterX - globeRadius * 1.16,
    globeCenterY - globeRadius * 1.16,
    globeRadius * 2.32,
    globeRadius * 2.32,
  );

  context.lineJoin = 'round';
  context.lineCap = 'round';

  context.save();
  context.strokeStyle = withOpacity(
    palette.smallCountryCircle,
    0.2 * alpha * (1 - progress * 0.72),
  );
  context.lineWidth = 1.15;
  context.setLineDash([7, 9]);
  context.lineDashOffset = -nowMs * 0.018;
  context.beginPath();
  path(transition.fromCountry as GeoPermissibleObjects);
  context.stroke();
  context.restore();

  context.save();
  context.strokeStyle = withOpacity(
    palette.selectedFill,
    0.3 * alpha * (0.42 + progress * 0.58),
  );
  context.lineWidth = 1.4 + progress * 0.8;
  context.shadowColor = withOpacity(palette.selectedFill, 0.34 * alpha);
  context.shadowBlur = 12;
  context.beginPath();
  path(transition.toCountry as GeoPermissibleObjects);
  context.stroke();
  context.restore();

  for (const [index, variant] of routeVariants.entries()) {
    const route = {
      type: 'LineString' as const,
      coordinates: variant.coordinates,
    };
    const brightness = index === 0 ? 1 : 0.62 - index * 0.08;

    context.save();
    context.shadowColor = withOpacity(palette.selectedFill, 0.22 * alpha * brightness);
    context.shadowBlur = index === 0 ? 14 : 8;
    context.strokeStyle = withOpacity(
      index === 0 ? palette.selectedFill : palette.smallCountryCircle,
      (0.16 + routePulse * 0.16) * alpha * brightness,
    );
    context.lineWidth = variant.width + routePulse * (index === 0 ? 0.95 : 0.35);
    context.setLineDash(index === 0 ? [18, 10] : [8, 11]);
    context.lineDashOffset = -nowMs * (0.028 + index * 0.006);
    context.beginPath();
    path(route);
    context.stroke();
    context.restore();
  }

  const primaryRouteCoordinates = routeVariants[0].coordinates;
  const packetOffsets = [progress * 1.08, progress * 1.08 - 0.18, progress * 1.08 - 0.36];
  for (const [index, offset] of packetOffsets.entries()) {
    if (offset <= 0 || offset >= 1) {
      continue;
    }

    const packetCoordinate = getRouteCoordinateAtProgress(
      primaryRouteCoordinates,
      offset,
    );
    const previousCoordinate = getRouteCoordinateAtProgress(
      primaryRouteCoordinates,
      Math.max(0, offset - 0.02),
    );
    const nextCoordinate = getRouteCoordinateAtProgress(
      primaryRouteCoordinates,
      Math.min(1, offset + 0.02),
    );

    if (!packetCoordinate || !previousCoordinate || !nextCoordinate) {
      continue;
    }

    const packetPoint = projection(packetCoordinate);
    const previousPoint = projection(previousCoordinate);
    const nextPoint = projection(nextCoordinate);
    if (!packetPoint || !previousPoint || !nextPoint) {
      continue;
    }

    const [packetX, packetY] = packetPoint;
    const angle = Math.atan2(
      nextPoint[1] - previousPoint[1],
      nextPoint[0] - previousPoint[0],
    );
    const pulse = 0.4 + 0.6 * Math.sin(nowMs * 0.009 + index * 0.85);

    context.save();
    context.shadowColor = withOpacity(palette.selectedFill, 0.44 * alpha);
    context.shadowBlur = 16;
    context.fillStyle = withOpacity(
      index === 0 ? '#f6ff9e' : palette.selectedFill,
      (0.56 + pulse * 0.28) * alpha,
    );
    context.translate(packetX, packetY);
    context.rotate(angle);
    context.fillRect(-4.8, -1.55, 9.6, 3.1);
    context.fillRect(2.6, -2.4, 2.4, 4.8);
    context.restore();
  }

  const endpointPoints = [
    {
      alpha: 0.32 * alpha * (1 - progress * 0.65),
      color: palette.smallCountryCircle,
      point: projection(fromCenter),
      radius: 8 + progress * 10,
    },
    {
      alpha: 0.34 * alpha * (0.45 + progress * 0.55),
      color: palette.selectedFill,
      point: projection(toCenter),
      radius: 9 + (1 - progress) * 11,
    },
  ];

  for (const endpoint of endpointPoints) {
    if (!endpoint.point) {
      continue;
    }

    const [x, y] = endpoint.point;
    context.save();
    context.strokeStyle = withOpacity(endpoint.color, endpoint.alpha);
    context.lineWidth = 1.2 + routePulse * 0.55;
    context.beginPath();
    context.arc(x, y, endpoint.radius, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  context.restore();
}

function drawCipherCriticalSites(args: {
  context: CanvasRenderingContext2D;
  currentRotation: [number, number];
  nowMs: number;
  projection: GeoProjection;
  sites: CipherCriticalSite[];
}) {
  const { context, currentRotation, nowMs, projection, sites } = args;
  const isVisible = createGlobeVisibilityTester(currentRotation);
  const visibleSites = sites
    .filter((site) => isVisible(site.longitude, site.latitude))
    .map((site) => ({
      point: projection([site.longitude, site.latitude]),
      site,
    }))
    .filter(
      (entry): entry is { point: [number, number]; site: CipherCriticalSite } =>
        Array.isArray(entry.point),
    )
    .slice(0, 16);

  context.save();
  context.globalCompositeOperation = 'screen';
  context.font =
    '500 9px "IBM Plex Mono", "SFMono-Regular", Consolas, monospace';

  for (const [index, entry] of visibleSites.entries()) {
    const [x, y] = entry.point;
    const pulse = 0.45 + 0.55 * Math.sin(nowMs * 0.004 + index * 0.75);
    const label =
      entry.site.kind === 'power'
        ? `${m.cipher_overlay_power_short()}`
        : `${m.cipher_overlay_water_short()}`;

    context.shadowColor = 'rgba(255, 80, 80, 0.34)';
    context.shadowBlur = 14;
    context.strokeStyle = `rgba(255, 88, 88, ${0.42 + pulse * 0.18})`;
    context.lineWidth = 1;
    context.beginPath();
    context.arc(x, y, 5.5 + pulse * 2.4, 0, Math.PI * 2);
    context.stroke();

    context.shadowBlur = 8;
    context.fillStyle = 'rgba(255, 106, 106, 0.94)';
    context.fillRect(x - 2, y - 2, 4, 4);

    context.shadowBlur = 0;
    context.strokeStyle = 'rgba(255, 112, 112, 0.7)';
    context.beginPath();
    context.moveTo(x - 7, y);
    context.lineTo(x + 7, y);
    context.moveTo(x, y - 7);
    context.lineTo(x, y + 7);
    context.stroke();

    context.fillStyle = 'rgba(255, 188, 188, 0.84)';
    context.fillText(`${label} ${entry.site.name.toUpperCase()}`, x + 8, y - 8);
  }

  context.restore();
}

export function drawCipherTrafficOverlay(args: {
  criticalSites: CipherCriticalSite[];
  context: CanvasRenderingContext2D;
  currentRotation: [number, number];
  nowMs: number;
  palette: GlobePalette;
  projection: GeoProjection;
  trafficState: CipherTrafficState;
}) {
  const {
    context,
    criticalSites,
    currentRotation,
    nowMs,
    palette,
    projection,
    trafficState,
  } = args;
  const isVisible = createGlobeVisibilityTester(currentRotation);
  const wallClockMs = Date.now();
  const visibleTracks = buildVisibleTrackList({
    currentRotation,
    nowMs: wallClockMs,
    tracks: trafficState.tracks,
  });
  const labelTracks = visibleTracks.slice(0, 8);

  context.save();
  context.globalCompositeOperation = 'screen';
  context.lineCap = 'round';
  context.lineJoin = 'round';
  drawCipherCriticalSites({
    context,
    currentRotation,
    nowMs,
    projection,
    sites: criticalSites,
  });

  for (const [index, track] of visibleTracks.entries()) {
    const sourceSample = getLatestSample(track);
    const latestSample = getAnimatedCipherSample(track, wallClockMs);
    const latestPoint =
      latestSample && isVisible(latestSample.longitude, latestSample.latitude)
        ? projection([latestSample.longitude, latestSample.latitude])
        : null;
    const freshness = sourceSample
      ? Math.max(
          0,
          1 - (wallClockMs - sourceSample.timestampMs) / (4 * 60 * 1000),
        )
      : 0;

    if (!latestPoint) {
      continue;
    }

    const markerX = latestPoint[0];
    const markerY = latestPoint[1];
    const ping = 0.45 + 0.55 * Math.sin(nowMs * 0.006 + index * 0.9);

    context.save();
    context.translate(markerX, markerY);
    context.rotate((((latestSample?.heading ?? 0) - 90) * Math.PI) / 180);
    context.shadowColor = withOpacity(palette.selectedFill, 0.35);
    context.shadowBlur = 10;
    context.fillStyle = withOpacity(
      palette.selectedFill,
      0.75 + freshness * 0.18,
    );
    context.beginPath();
    context.moveTo(5.5, 0);
    context.lineTo(-3.5, -2.4);
    context.lineTo(-1.8, 0);
    context.lineTo(-3.5, 2.4);
    context.closePath();
    context.fill();
    context.restore();

    context.shadowBlur = 0;
    context.strokeStyle = withOpacity(
      palette.smallCountryCircle,
      0.16 + ping * 0.16,
    );
    context.lineWidth = 1;
    context.beginPath();
    context.arc(markerX, markerY, 6 + ping * 4, 0, Math.PI * 2);
    context.stroke();
  }

  context.shadowBlur = 0;
  context.setLineDash([]);
  for (const track of labelTracks) {
    const latestSample = getAnimatedCipherSample(track, wallClockMs);
    if (!latestSample) {
      continue;
    }

    if (!isVisible(latestSample.longitude, latestSample.latitude)) {
      continue;
    }

    const point = projection([latestSample.longitude, latestSample.latitude]);
    if (!point) {
      continue;
    }

    context.fillStyle = withOpacity('#f6ff9e', 0.84);
    context.font =
      '500 9px "IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
    context.fillText(
      `${formatCipherTrackCallsign(track)}  ${formatCipherTrackVelocity(latestSample.velocity)}KT`,
      point[0] + 8,
      point[1] - 8,
    );
  }

  context.restore();
}
