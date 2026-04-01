import {
  geoCircle,
  geoDistance,
  geoGraticule10,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from 'd3';
import { useId, useMemo } from 'react';
import type { AppThemeId, GlobePalette } from '@/app/theme';
import {
  createNightCircle,
  getProjectedTerminatorHalfWidthPx,
  getCountryHighlightRings,
  useGlobeInteraction,
  type GlobeViewProps,
} from './globeShared';

const sphere: GeoPermissibleObjects = { type: 'Sphere' };

interface SvgGlobeProps extends GlobeViewProps {
  palette: GlobePalette;
  themeId: AppThemeId;
}

export function SvgGlobe({
  country,
  mode,
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
  const projectedGlobeRadius = baseScale * zoomScale;
  const spherePath = path(sphere) ?? '';
  const worldPath = path(world as GeoPermissibleObjects) ?? '';
  const targetPath = path(targetFeature as GeoPermissibleObjects) ?? '';
  const graticulePath = path(geoGraticule10()) ?? '';
  const nightPath = path(createNightCircle()) ?? '';
  const selectedRingPaths = useMemo(
    () =>
      getCountryHighlightRings(targetFeature)
        .map((ring) => path(geoCircle().center(ring.center).radius(ring.radius)()))
        .filter((ringPath): ringPath is string => Boolean(ringPath)),
    [path, targetFeature],
  );
  const capitalPoint = useMemo(() => {
    if (
      mode !== 'capitals' ||
      typeof targetFeature.properties.capitalLongitude !== 'number' ||
      typeof targetFeature.properties.capitalLatitude !== 'number'
    ) {
      return null;
    }

    const centerLongitude = -currentRotation[0];
    const centerLatitude = -currentRotation[1];
    const isVisible =
      geoDistance(
        [centerLongitude, centerLatitude],
        [
          targetFeature.properties.capitalLongitude,
          targetFeature.properties.capitalLatitude,
        ],
      ) <=
      Math.PI / 2;

    if (!isVisible) {
      return null;
    }

    const projected = projection([
      targetFeature.properties.capitalLongitude,
      targetFeature.properties.capitalLatitude,
    ]);
    if (!projected) {
      return null;
    }

    return {
      x: projected[0],
      y: projected[1],
    };
  }, [currentRotation, mode, projection, targetFeature]);
  const gradientId = useId();
  const clipId = useId();
  const shadowFilterId = useId();
  const terminatorBlurPx = useMemo(
    () => Math.max(getProjectedTerminatorHalfWidthPx(projectedGlobeRadius) * 0.5, 0.75),
    [projectedGlobeRadius],
  );

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
        <filter
          filterUnits="userSpaceOnUse"
          height={height * 3}
          id={shadowFilterId}
          width={width * 3}
          x={-width}
          y={-height}
        >
          <feGaussianBlur stdDeviation={terminatorBlurPx} />
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
      {mode === 'capitals' ? null : (
        <>
          <path
            d={targetPath}
            fill={palette.selectedFill}
            stroke={palette.countryStroke}
            strokeWidth={1}
          />
          {selectedRingPaths.map((ringPath, index) => (
            <path
              key={`${targetFeature.id}-ring-${index}`}
              d={ringPath}
              fill="none"
              stroke={palette.smallCountryCircle}
              strokeWidth={2}
            />
          ))}
        </>
      )}
      {mode === 'capitals' && capitalPoint ? (
        <g>
          <circle
            cx={capitalPoint.x}
            cy={capitalPoint.y}
            fill={palette.smallCountryCircle}
            r={2.8}
          />
          {[10, 16].map((radius) => (
            <circle
              key={radius}
              cx={capitalPoint.x}
              cy={capitalPoint.y}
              fill="none"
              opacity={0.45}
              r={radius}
              stroke={palette.smallCountryCircle}
              strokeWidth={1.2}
            />
          ))}
        </g>
      ) : null}
      <g clipPath={`url(#${clipId})`}>
        <path
          d={nightPath}
          filter={`url(#${shadowFilterId})`}
          fill={palette.nightShade}
          opacity={0.92}
        />
      </g>
    </svg>
  );
}
