import {
  geoCircle,
  geoPath,
  type GeoPermissibleObjects,
} from 'd3';
import type { GlobePalette } from '@/app/theme';
import type { FeatureCollectionLike } from '@/types/game';
import { shiftColor } from '@/utils/globeColors';

export function applyAtlasPaperTexture(
  context: CanvasRenderingContext2D,
  textureCanvas: HTMLCanvasElement,
  atlasPaperImage: HTMLImageElement | null,
) {
  if (!atlasPaperImage) {
    return;
  }

  context.save();
  context.globalAlpha = 0.3;
  context.globalCompositeOperation = 'multiply';
  context.drawImage(
    atlasPaperImage,
    0,
    0,
    textureCanvas.width,
    textureCanvas.height,
  );
  context.globalAlpha = 0.16;
  context.globalCompositeOperation = 'soft-light';
  context.drawImage(
    atlasPaperImage,
    0,
    0,
    textureCanvas.width,
    textureCanvas.height,
  );
  context.restore();
}

export function applyAtlasParchmentAging(
  context: CanvasRenderingContext2D,
  textureCanvas: HTMLCanvasElement,
  palette: GlobePalette,
) {
  const { width, height } = textureCanvas;
  context.save();

  const edgeDarken = context.createRadialGradient(
    width * 0.5,
    height * 0.5,
    width * 0.12,
    width * 0.5,
    height * 0.5,
    width * 0.78,
  );
  edgeDarken.addColorStop(0, shiftColor(palette.oceanFill, 0, 0, 0, 0));
  edgeDarken.addColorStop(1, 'rgba(88, 55, 21, 0.28)');
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = edgeDarken;
  context.fillRect(0, 0, width, height);

  const warmBloom = context.createRadialGradient(
    width * 0.42,
    height * 0.37,
    width * 0.06,
    width * 0.42,
    height * 0.37,
    width * 0.65,
  );
  warmBloom.addColorStop(0, 'rgba(251, 234, 194, 0.18)');
  warmBloom.addColorStop(1, 'rgba(210, 173, 118, 0)');
  context.globalCompositeOperation = 'screen';
  context.fillStyle = warmBloom;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = 'multiply';
  for (let index = 0; index < 26; index += 1) {
    const x = ((index * 197) % width) + (index % 5) * 7;
    const y = ((index * 131) % height) + (index % 4) * 9;
    const radius = width * (0.0015 + (index % 3) * 0.0006);
    const blot = context.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    blot.addColorStop(0, 'rgba(112, 74, 35, 0.07)');
    blot.addColorStop(0.65, 'rgba(151, 103, 52, 0.03)');
    blot.addColorStop(1, 'rgba(169, 131, 82, 0)');
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'multiply';
  context.globalAlpha = 0.18;
  context.strokeStyle = 'rgba(118, 80, 40, 0.35)';
  context.lineWidth = Math.max(width / 4200, 0.35);
  for (let fold = 0; fold < 3; fold += 1) {
    const x = width * (0.2 + fold * 0.3);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + (fold - 1) * 8, height);
    context.stroke();
  }

  context.restore();
}

export function applyAtlasSatelliteWatercolor(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  textureCanvas: HTMLCanvasElement,
  palette: GlobePalette,
  atlasImageryImage: HTMLImageElement | null,
) {
  if (!atlasImageryImage) {
    return;
  }

  const { width, height } = textureCanvas;
  const imageryCanvas = document.createElement('canvas');
  imageryCanvas.width = width;
  imageryCanvas.height = height;
  const imageryContext = imageryCanvas.getContext('2d');
  if (!imageryContext) {
    return;
  }

  imageryContext.drawImage(atlasImageryImage, 0, 0, width, height);
  const imageryData = imageryContext.getImageData(0, 0, width, height);
  const pixels = imageryData.data;
  const levels = 8;

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index] ?? 0;
    const green = pixels[index + 1] ?? 0;
    const blue = pixels[index + 2] ?? 0;
    const x = (index / 4) % width;
    const y = Math.floor(index / 4 / width);
    const luma = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;
    const posterized = Math.round(luma * (levels - 1)) / (levels - 1);
    const pigmentNoise =
      (Math.sin(x * 0.053 + y * 0.031) + Math.sin(x * 0.11 - y * 0.046)) *
      0.018;
    const paperMapped = Math.max(0, Math.min(1, posterized + pigmentNoise));
    const ink = Math.pow(paperMapped, 0.92);

    pixels[index] = Math.round(ink * 244);
    pixels[index + 1] = Math.round(ink * 231);
    pixels[index + 2] = Math.round(ink * 202);
    pixels[index + 3] = 255;
  }

  imageryContext.putImageData(imageryData, 0, 0);

  context.save();

  context.globalAlpha = 0.34;
  context.globalCompositeOperation = 'multiply';
  context.drawImage(imageryCanvas, 0, 0);

  context.globalCompositeOperation = 'soft-light';
  context.fillStyle = shiftColor(palette.oceanFill, 8, 12, 14, 0.38);
  context.fillRect(0, 0, width, height);

  context.save();
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
  }
  context.clip();

  context.globalCompositeOperation = 'multiply';
  context.globalAlpha = 0.72;
  context.drawImage(imageryCanvas, 0, 0);
  context.fillStyle = shiftColor(palette.countryFill, -8, -4, -3, 0.3);
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'soft-light';
  context.globalAlpha = 0.32;
  context.fillStyle = shiftColor(palette.countryFill, 20, 18, 8, 0.34);
  context.fillRect(0, 0, width, height);

  context.restore();
  context.restore();
}

export function applyAtlasWatercolorOcean(
  context: CanvasRenderingContext2D,
  textureCanvas: HTMLCanvasElement,
  palette: GlobePalette,
) {
  const { width, height } = textureCanvas;
  context.save();

  const wash = context.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, shiftColor(palette.oceanFill, -8, -6, -2, 0.38));
  wash.addColorStop(0.5, shiftColor(palette.oceanFill, 7, 10, 14, 0.22));
  wash.addColorStop(1, shiftColor(palette.oceanFill, -10, -10, -6, 0.36));
  context.fillStyle = wash;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = 'multiply';
  for (let index = 0; index < 24; index += 1) {
    const x = ((index * 227) % width) + (index % 3) * 17;
    const y = ((index * 139) % height) + (index % 5) * 11;
    const radius = width * (0.035 + (index % 7) * 0.004);
    const blot = context.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    blot.addColorStop(0, shiftColor(palette.oceanFill, -20, -14, -10, 0.09));
    blot.addColorStop(1, shiftColor(palette.oceanFill, 8, 10, 14, 0));
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'soft-light';
  for (let index = 0; index < 18; index += 1) {
    const x = ((index * 193) % width) + 8;
    const y = ((index * 101) % height) + 6;
    const radius = width * (0.022 + (index % 5) * 0.003);
    const blot = context.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    blot.addColorStop(0, shiftColor(palette.oceanFill, 18, 22, 30, 0.11));
    blot.addColorStop(1, shiftColor(palette.oceanFill, 0, 0, 0, 0));
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

export function applyAtlasOceanCurrentHatching(
  context: CanvasRenderingContext2D,
  textureCanvas: HTMLCanvasElement,
) {
  const { width, height } = textureCanvas;
  const spacing = Math.max(Math.floor(height / 24), 14);

  context.save();
  context.globalAlpha = 0.22;
  context.strokeStyle = 'rgba(98, 121, 124, 0.24)';
  context.lineWidth = Math.max(width / 4600, 0.4);

  for (let y = -spacing; y <= height + spacing; y += spacing) {
    context.beginPath();
    for (let x = 0; x <= width; x += 24) {
      const wave =
        Math.sin((x / width) * Math.PI * 4.0 + y * 0.02) * 2.4 +
        Math.sin((x / width) * Math.PI * 11.0 + y * 0.011) * 0.9;
      const py = y + wave;
      if (x === 0) {
        context.moveTo(x, py);
      } else {
        context.lineTo(x, py);
      }
    }
    context.stroke();
  }

  context.globalAlpha = 0.13;
  context.strokeStyle = 'rgba(240, 233, 205, 0.2)';
  context.lineWidth = Math.max(width / 5400, 0.3);
  for (let y = spacing / 2; y <= height + spacing; y += spacing) {
    context.beginPath();
    for (let x = 0; x <= width; x += 24) {
      const wave = Math.sin((x / width) * Math.PI * 5.0 + y * 0.018) * 1.8;
      const py = y + wave;
      if (x === 0) {
        context.moveTo(x, py);
      } else {
        context.lineTo(x, py);
      }
    }
    context.stroke();
  }

  context.restore();
}

export function applyAtlasWatercolorLand(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  textureCanvas: HTMLCanvasElement,
  palette: GlobePalette,
) {
  const { width, height } = textureCanvas;

  context.save();
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
  }
  context.clip();

  const landWash = context.createLinearGradient(0, 0, width, height);
  landWash.addColorStop(0, shiftColor(palette.countryFill, 16, 14, 6, 0.2));
  landWash.addColorStop(0.5, shiftColor(palette.countryFill, -8, -10, -4, 0.16));
  landWash.addColorStop(1, shiftColor(palette.countryFill, 8, 8, 3, 0.18));
  context.fillStyle = landWash;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = 'multiply';
  for (let index = 0; index < 28; index += 1) {
    const x = ((index * 181) % width) + (index % 4) * 9;
    const y = ((index * 127) % height) + (index % 6) * 7;
    const radius = width * (0.028 + (index % 6) * 0.004);
    const blot = context.createRadialGradient(x, y, radius * 0.15, x, y, radius);
    blot.addColorStop(0, shiftColor(palette.countryFill, -20, -16, -8, 0.08));
    blot.addColorStop(1, shiftColor(palette.countryFill, 2, 2, 1, 0));
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'soft-light';
  for (let index = 0; index < 20; index += 1) {
    const x = ((index * 149) % width) + 5;
    const y = ((index * 113) % height) + 5;
    const radius = width * (0.016 + (index % 5) * 0.0035);
    const blot = context.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    blot.addColorStop(0, shiftColor(palette.countryFill, 24, 22, 12, 0.1));
    blot.addColorStop(1, shiftColor(palette.countryFill, 0, 0, 0, 0));
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

export function applyAtlasInkBleed(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  textureCanvas: HTMLCanvasElement,
) {
  context.save();
  context.globalAlpha = 0.18;
  context.strokeStyle = 'rgba(70, 42, 18, 0.42)';
  context.lineWidth = Math.max(textureCanvas.width / 2300, 0.8);
  context.shadowColor = 'rgba(61, 35, 14, 0.35)';
  context.shadowBlur = Math.max(textureCanvas.width / 480, 2.4);
  context.shadowOffsetX = 0;
  context.shadowOffsetY = Math.max(textureCanvas.width / 4096, 0.45);
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.stroke();
  }
  context.restore();
}

export function applyAtlasInkCoastline(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  textureCanvas: HTMLCanvasElement,
) {
  context.save();
  context.globalAlpha = 0.9;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.strokeStyle = 'rgba(78, 46, 20, 0.58)';
  context.lineWidth = Math.max(textureCanvas.width / 2048, 0.95);
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.stroke();
  }

  context.globalAlpha = 0.45;
  context.strokeStyle = 'rgba(244, 231, 198, 0.46)';
  context.lineWidth = Math.max(textureCanvas.width / 4096, 0.45);
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.stroke();
  }
  context.restore();
}

export function applyAtlasCoastalWash(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  textureCanvas: HTMLCanvasElement,
  palette: GlobePalette,
) {
  context.save();

  context.globalAlpha = 0.34;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.strokeStyle = shiftColor(palette.oceanFill, 22, 24, 28, 0.36);
  context.lineWidth = Math.max(textureCanvas.width / 540, 3.2);
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.stroke();
  }

  context.globalAlpha = 0.25;
  context.strokeStyle = shiftColor(palette.oceanFill, -12, -10, -6, 0.32);
  context.lineWidth = Math.max(textureCanvas.width / 900, 1.9);
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.stroke();
  }

  context.restore();
}

export function applyAtlasLandHachure(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  textureCanvas: HTMLCanvasElement,
) {
  const { width, height } = textureCanvas;
  const spacing = Math.max(Math.floor(width / 96), 14);

  context.save();
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
  }
  context.clip();

  context.globalAlpha = 0.2;
  context.strokeStyle = 'rgba(93, 58, 28, 0.24)';
  context.lineWidth = Math.max(width / 3072, 0.5);
  for (let offset = -height; offset < width + height; offset += spacing) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset - height, height);
    context.stroke();
  }

  context.globalAlpha = 0.11;
  context.strokeStyle = 'rgba(244, 229, 198, 0.22)';
  context.lineWidth = Math.max(width / 4096, 0.4);
  for (let offset = -height + spacing / 2; offset < width + height; offset += spacing) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset - height, height);
    context.stroke();
  }

  context.restore();
}

export function drawAtlasExpeditionDetails(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  textureCanvas: HTMLCanvasElement,
) {
  context.save();

  context.strokeStyle = 'rgba(112, 72, 29, 0.18)';
  context.lineWidth = Math.max(textureCanvas.width / 2400, 0.8);
  context.setLineDash([7, 9]);
  for (const route of [
    geoCircle().center([-18, 12]).radius(58)(),
    geoCircle().center([74, -4]).radius(46)(),
    geoCircle().center([-110, 28]).radius(70)(),
  ]) {
    context.beginPath();
    path(route);
    context.stroke();
  }

  context.restore();
}
