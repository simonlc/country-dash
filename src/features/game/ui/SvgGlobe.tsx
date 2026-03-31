import {
  geoCentroid,
  geoCircle,
  geoGraticule10,
  geoLength,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from 'd3';
import { useId, useMemo } from 'react';
import type { GlobePalette } from '@/app/theme';
import {
  createNightCircle,
  useGlobeInteraction,
  type GlobeViewProps,
} from './globeShared';

const sphere: GeoPermissibleObjects = { type: 'Sphere' };

interface SvgGlobeProps extends GlobeViewProps {
  palette: GlobePalette;
}

export function SvgGlobe({
  country,
  width,
  height,
  rotation,
  focusRequest,
  world,
  palette,
}: SvgGlobeProps) {
  const baseScale = useMemo(
    () => Math.max(Math.min(width, height) / 2 - 10, 1),
    [height, width],
  );
  const targetFeature = useMemo(
    () =>
      world.features.find(
        (feature): feature is typeof country => feature.id === country.id,
      ) ?? country,
    [country, world.features],
  );
  const { currentRotation, interactionHandlers, zoomScale } = useGlobeInteraction({
    baseScale,
    focusRequest,
    rotation,
  });
  const projection = useMemo(
    () =>
      geoOrthographic()
        .scale(baseScale * zoomScale)
        .center([0, 0])
        .translate([width / 2, height / 2])
        .rotate([currentRotation[0], currentRotation[1], 0]),
    [baseScale, currentRotation, height, width, zoomScale],
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const spherePath = path(sphere) ?? '';
  const worldPath = path(world as GeoPermissibleObjects) ?? '';
  const targetPath = path(targetFeature as GeoPermissibleObjects) ?? '';
  const graticulePath = path(geoGraticule10()) ?? '';
  const nightPath = path(createNightCircle()) ?? '';
  const selectedCirclePath = path(
    geoCircle().center(geoCentroid(targetFeature as GeoPermissibleObjects)).radius(1)(),
  );
  const countrySize = useMemo(() => geoLength(targetFeature), [targetFeature]);
  const gradientId = useId();
  const clipId = useId();
  const filterId = useId();

  return (
    <svg
      height={height}
      style={{ display: 'block', touchAction: 'none', width }}
      width={width}
      {...interactionHandlers}
    >
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor={palette.hazeInner} />
          <stop offset="100%" stopColor={palette.hazeOuter} />
        </radialGradient>
        <clipPath id={clipId}>
          <path d={spherePath} />
        </clipPath>
        <filter id={filterId}>
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <rect fill={palette.hazeOuter} height={height} width={width} x={0} y={0} />
      <rect
        fill={`url(#${gradientId})`}
        height={height}
        opacity={0.6}
        width={width}
        x={0}
        y={0}
      />
      <path d={spherePath} fill={palette.oceanFill} />
      <path
        d={graticulePath}
        fill="none"
        stroke={palette.graticule}
        strokeWidth={0.8}
      />
      <path
        d={worldPath}
        fill={palette.countryFill}
        stroke={palette.countryStroke}
        strokeWidth={0.8}
      />
      <path
        d={targetPath}
        fill={palette.selectedFill}
        stroke={palette.countryStroke}
        strokeWidth={1}
      />
      {countrySize < 0.02 && selectedCirclePath ? (
        <path
          d={selectedCirclePath}
          fill="none"
          stroke={palette.smallCountryCircle}
          strokeWidth={2}
        />
      ) : null}
      <g clipPath={`url(#${clipId})`}>
        <path
          d={nightPath}
          fill={palette.nightShade}
          filter={`url(#${filterId})`}
        />
      </g>
    </svg>
  );
}
