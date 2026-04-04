import { type GeoPermissibleObjects } from 'd3';

type AtlasPath = {
  (feature: GeoPermissibleObjects): void;
  bounds(feature: GeoPermissibleObjects): [[number, number], [number, number]];
};
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import type { GlobeQualityConfig, GlobeRenderConfig } from '@/app/theme';
import { shiftColor, withOpacity } from '@/utils/globeColors';

export type HydroFeatureCollection = FeatureCollection<
  Geometry,
  GeoJsonProperties
>;

function isHydroFeatureCollection(value: object | null): value is HydroFeatureCollection {
  if (!value) {
    return false;
  }

  const candidate = value as {
    features?: object;
    type?: string;
  };
  return candidate.type === 'FeatureCollection' && Array.isArray(candidate.features);
}

export async function loadHydroFeatureCollection(path: string) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load hydro layer: ${path}`);
  }

  const data = (await response.json()) as object | null;
  if (!isHydroFeatureCollection(data)) {
    throw new Error(`Invalid hydro layer: ${path}`);
  }

  return data;
}

export function drawHydroLayers(args: {
  context: CanvasRenderingContext2D;
  lakesData: HydroFeatureCollection | null;
  path: AtlasPath;
  quality: GlobeQualityConfig;
  render: GlobeRenderConfig;
  riversData: HydroFeatureCollection | null;
  textureCanvas: HTMLCanvasElement;
}) {
  const {
    context,
    lakesData,
    path,
    quality,
    render,
    riversData,
    textureCanvas,
  } = args;

  if (quality.showLakes && lakesData) {
    if (render.cipherHydroTextureEffectOpacity > 0) {
      context.save();
      context.globalAlpha *= render.cipherHydroTextureEffectOpacity;
      context.globalCompositeOperation = 'screen';
      context.shadowColor = withOpacity(quality.lakesColor, 0.52);
      context.shadowBlur = Math.max(textureCanvas.width / 180, 6);
      context.fillStyle = withOpacity(
        quality.lakesColor,
        quality.lakesOpacity * 0.42,
      );
      for (const feature of lakesData.features) {
        context.beginPath();
        path(feature as GeoPermissibleObjects);
        context.fill();
      }
      context.restore();

      context.save();
      context.globalAlpha *= render.cipherHydroTextureEffectOpacity;
      for (const feature of lakesData.features) {
        context.beginPath();
        path(feature as GeoPermissibleObjects);
      }
      context.clip();

      const lakeWash = context.createLinearGradient(
        0,
        0,
        textureCanvas.width,
        textureCanvas.height,
      );
      lakeWash.addColorStop(
        0,
        shiftColor(quality.lakesColor, 120, 0, 18, 0.16),
      );
      lakeWash.addColorStop(
        0.5,
        shiftColor(quality.lakesColor, 10, -10, -18, 0.08),
      );
      lakeWash.addColorStop(
        1,
        shiftColor(quality.lakesColor, 130, 8, 22, 0.14),
      );
      context.globalCompositeOperation = 'screen';
      context.fillStyle = lakeWash;
      context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

      context.strokeStyle = withOpacity(quality.lakesColor, 0.08);
      context.lineWidth = Math.max(textureCanvas.width / 6144, 0.5);
      const spacing = Math.max(Math.floor(textureCanvas.width / 70), 16);
      for (
        let offset = -textureCanvas.height;
        offset < textureCanvas.width + textureCanvas.height;
        offset += spacing
      ) {
        context.beginPath();
        context.moveTo(offset, 0);
        context.lineTo(offset - textureCanvas.height * 0.55, textureCanvas.height);
        context.stroke();
      }
      context.restore();

      context.save();
      context.globalAlpha *= render.cipherHydroTextureEffectOpacity;
      context.strokeStyle = shiftColor(quality.lakesColor, 135, 0, 24, 0.26);
      context.lineWidth = Math.max(textureCanvas.width / 4096, 0.8);
      for (const feature of lakesData.features) {
        context.beginPath();
        path(feature as GeoPermissibleObjects);
        context.stroke();
      }
      context.restore();
    }

    context.fillStyle = withOpacity(quality.lakesColor, quality.lakesOpacity);
    for (const feature of lakesData.features) {
      context.beginPath();
      path(feature as GeoPermissibleObjects);
      context.fill();
    }
  }

  if (quality.showRivers && riversData) {
    if (render.cipherHydroTextureEffectOpacity > 0) {
      context.save();
      context.globalAlpha *= render.cipherHydroTextureEffectOpacity;
      context.globalCompositeOperation = 'screen';
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = withOpacity(quality.riversColor, 0.48);
      context.shadowColor = withOpacity(quality.riversColor, 0.7);
      context.shadowBlur = Math.max(textureCanvas.width / 200, 5);
      context.lineWidth = Math.max(
        textureCanvas.width / 2048,
        quality.riversWidth * 3.4,
      );
      for (const feature of riversData.features) {
        context.beginPath();
        path(feature as GeoPermissibleObjects);
        context.stroke();
      }
      context.restore();
    }

    context.globalAlpha = Math.max(0, Math.min(1, quality.riversOpacity));
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = Math.max(
      textureCanvas.width / 4096,
      quality.riversWidth,
    );
    context.strokeStyle = quality.riversColor;
    for (const feature of riversData.features) {
      context.beginPath();
      path(feature as GeoPermissibleObjects);
      context.stroke();
    }
    context.globalAlpha = 1;

    if (render.cipherHydroTextureEffectOpacity > 0) {
      context.save();
      context.globalAlpha *= render.cipherHydroTextureEffectOpacity;
      context.globalCompositeOperation = 'screen';
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = shiftColor(quality.riversColor, 140, 0, 26, 0.58);
      context.lineWidth = Math.max(
        textureCanvas.width / 8192,
        quality.riversWidth * 1.7,
      );
      for (const feature of riversData.features) {
        context.beginPath();
        path(feature as GeoPermissibleObjects);
        context.stroke();
      }
      context.restore();
    }
  }
}

export function drawCipherHydroOverlay(args: {
  context: CanvasRenderingContext2D;
  height: number;
  lakesData: HydroFeatureCollection | null;
  nowMs: number;
  path: AtlasPath;
  quality: GlobeQualityConfig;
  riversData: HydroFeatureCollection | null;
  width: number;
}) {
  const {
    context,
    height,
    lakesData,
    nowMs,
    path,
    quality,
    riversData,
    width,
  } = args;

  if (quality.showLakes && lakesData) {
    context.save();
    for (const feature of lakesData.features) {
      context.beginPath();
      path(feature as GeoPermissibleObjects);
    }
    context.clip();

    context.globalCompositeOperation = 'screen';
    context.fillStyle = shiftColor(quality.lakesColor, 26, 0, 16, 0.04);
    context.fillRect(0, 0, width, height);

    const latticeSpacing = Math.max(Math.min(width, height) / 20, 22);
    const rowSpacing = latticeSpacing * 0.84;
    for (
      let rowIndex = 0, y = -rowSpacing;
      y <= height + rowSpacing;
      rowIndex += 1, y += rowSpacing
    ) {
      const rowOffset = rowIndex % 2 === 0 ? 0 : latticeSpacing * 0.48;
      for (
        let x = -latticeSpacing;
        x <= width + latticeSpacing;
        x += latticeSpacing
      ) {
        const px = x + rowOffset;
        const flow =
          Math.sin(px * 0.041 + y * 0.082 - nowMs * 0.00034) * 0.5 + 0.5;
        const beat =
          Math.sin(
            px * 0.017 - y * 0.024 + nowMs * 0.00021 + rowIndex * 0.31,
          ) *
            0.5 +
          0.5;
        const signal = flow * 0.68 + beat * 0.32;

        if (signal < 0.58) {
          continue;
        }

        const intensity = (signal - 0.58) / 0.42;
        const glyphWidth = 4.5 + intensity * 7.4;
        const glyphHeight = 1.2 + intensity * 1.4;

        context.fillStyle = shiftColor(
          quality.lakesColor,
          156,
          12,
          44,
          0.08 + intensity * 0.18,
        );
        context.fillRect(
          px - glyphWidth * 0.5,
          y - glyphHeight * 0.5,
          glyphWidth,
          glyphHeight,
        );

        if (intensity > 0.54) {
          context.fillStyle = shiftColor(
            quality.lakesColor,
            192,
            26,
            54,
            0.08 + intensity * 0.14,
          );
          context.fillRect(px - 0.8, y - 2, 1.6, 4);
        }
      }
    }
    context.restore();

    let visibleLakeCount = 0;
    for (const feature of lakesData.features) {
      const lakeShape = feature as GeoPermissibleObjects;
      const [[minX, minY], [maxX, maxY]] = path.bounds(lakeShape);
      const boundsWidth = maxX - minX;
      const boundsHeight = maxY - minY;

      if (
        !Number.isFinite(minX) ||
        !Number.isFinite(minY) ||
        !Number.isFinite(maxX) ||
        !Number.isFinite(maxY) ||
        boundsWidth < 12 ||
        boundsHeight < 12
      ) {
        continue;
      }

      context.save();
      context.globalCompositeOperation = 'screen';
      context.shadowColor = shiftColor(quality.lakesColor, 180, 14, 42, 0.34);
      context.shadowBlur = 10;
      context.strokeStyle = shiftColor(
        quality.lakesColor,
        164,
        10,
        38,
        0.22,
      );
      context.lineWidth = 1;
      context.beginPath();
      path(lakeShape);
      context.stroke();

      const tracerLength = Math.max(
        14,
        Math.min((boundsWidth + boundsHeight) * 0.14, 34),
      );
      context.shadowBlur = 14;
      context.strokeStyle = shiftColor(
        quality.lakesColor,
        196,
        28,
        56,
        0.48,
      );
      context.lineWidth = 1.45;
      context.setLineDash([tracerLength, tracerLength * 1.9]);
      context.lineDashOffset = -nowMs * 0.008 + visibleLakeCount * 11;
      context.beginPath();
      path(lakeShape);
      context.stroke();

      context.shadowBlur = 8;
      context.strokeStyle = shiftColor(
        quality.lakesColor,
        124,
        4,
        24,
        0.14,
      );
      context.lineWidth = 2.2;
      context.setLineDash([2.2, tracerLength * 2.6]);
      context.lineDashOffset = nowMs * 0.004 + visibleLakeCount * 7;
      context.beginPath();
      path(lakeShape);
      context.stroke();
      context.restore();

      visibleLakeCount += 1;
      if (visibleLakeCount >= 18) {
        break;
      }
    }
  }

  if (quality.showRivers && riversData) {
    context.save();
    context.globalCompositeOperation = 'screen';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = withOpacity(quality.riversColor, 0.14);
    context.lineWidth = Math.max(1, quality.riversWidth * 3 + 0.6);
    for (const feature of riversData.features) {
      context.beginPath();
      path(feature as GeoPermissibleObjects);
      context.stroke();
    }

    context.strokeStyle = shiftColor(quality.riversColor, 165, 12, 40, 0.72);
    context.shadowColor = shiftColor(quality.riversColor, 170, 14, 42, 0.5);
    context.shadowBlur = 14;
    context.lineWidth = Math.max(1.4, quality.riversWidth * 2.5 + 1.05);
    context.setLineDash([4.2, 14]);
    context.lineDashOffset = -nowMs * 0.022;
    for (const feature of riversData.features) {
      context.beginPath();
      path(feature as GeoPermissibleObjects);
      context.stroke();
    }

    context.shadowBlur = 10;
    context.strokeStyle = shiftColor(quality.riversColor, 190, 28, 54, 0.42);
    context.lineWidth = Math.max(1, quality.riversWidth * 1.55 + 0.45);
    context.setLineDash([1.2, 21]);
    context.lineDashOffset = -nowMs * 0.014 + 9;
    for (const feature of riversData.features) {
      context.beginPath();
      path(feature as GeoPermissibleObjects);
      context.stroke();
    }

    context.shadowBlur = 0;
    context.strokeStyle = withOpacity(quality.riversColor, 0.16);
    context.lineWidth = Math.max(0.9, quality.riversWidth * 1.35 + 0.25);
    context.setLineDash([]);
    for (const feature of riversData.features) {
      context.beginPath();
      path(feature as GeoPermissibleObjects);
      context.stroke();
    }
    context.restore();
  }
}
