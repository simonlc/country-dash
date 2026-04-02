import { geoCircle, geoPath, type GeoPermissibleObjects } from 'd3';
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
  context.globalAlpha = 0.38;
  context.globalCompositeOperation = 'multiply';
  context.drawImage(
    atlasPaperImage,
    0,
    0,
    textureCanvas.width,
    textureCanvas.height,
  );
  context.globalAlpha = 0.22;
  context.globalCompositeOperation = 'soft-light';
  context.drawImage(
    atlasPaperImage,
    0,
    0,
    textureCanvas.width,
    textureCanvas.height,
  );
  context.globalAlpha = 0.12;
  context.globalCompositeOperation = 'screen';
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
  edgeDarken.addColorStop(0.72, 'rgba(116, 90, 58, 0.08)');
  edgeDarken.addColorStop(1, 'rgba(92, 67, 40, 0.24)');
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
  warmBloom.addColorStop(0, 'rgba(255, 240, 206, 0.18)');
  warmBloom.addColorStop(0.56, 'rgba(221, 195, 150, 0.08)');
  warmBloom.addColorStop(1, 'rgba(210, 173, 118, 0)');
  context.globalCompositeOperation = 'screen';
  context.fillStyle = warmBloom;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = 'multiply';
  for (let index = 0; index < 30; index += 1) {
    const x = ((index * 197) % width) + (index % 5) * 7;
    const y = ((index * 131) % height) + (index % 4) * 9;
    const radius = width * (0.0018 + (index % 3) * 0.0007);
    const blot = context.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    blot.addColorStop(0, 'rgba(96, 69, 41, 0.07)');
    blot.addColorStop(0.65, 'rgba(149, 108, 63, 0.035)');
    blot.addColorStop(1, 'rgba(169, 131, 82, 0)');
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'multiply';
  context.globalAlpha = 0.16;
  context.strokeStyle = 'rgba(120, 92, 62, 0.3)';
  context.lineWidth = Math.max(width / 4200, 0.35);
  for (let fold = 0; fold < 3; fold += 1) {
    const x = width * (0.2 + fold * 0.3);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + (fold - 1) * 8, height);
    context.stroke();
  }

  context.globalCompositeOperation = 'soft-light';
  context.globalAlpha = 0.14;
  context.fillStyle = 'rgba(255, 248, 229, 0.22)';
  context.fillRect(0, 0, width, height);

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
  const levels = 9;

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index] ?? 0;
    const green = pixels[index + 1] ?? 0;
    const blue = pixels[index + 2] ?? 0;
    const x = (index / 4) % width;
    const y = Math.floor(index / 4 / width);
    const luma = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;
    const posterized = Math.round(luma * (levels - 1)) / (levels - 1);
    const coolBias = Math.max(0, Math.min(1, (blue - red + 96) / 192));
    const warmBias = Math.max(0, Math.min(1, (red - blue + 96) / 192));
    const pigmentNoise =
      (Math.sin(x * 0.053 + y * 0.031) + Math.sin(x * 0.11 - y * 0.046)) * 0.02;
    const granulation =
      Math.sin(x * 0.012 - y * 0.018) * 0.024 +
      Math.sin(x * 0.031 + y * 0.009) * 0.014;
    const paperMapped = Math.max(
      0,
      Math.min(1, posterized + pigmentNoise + granulation),
    );
    const wash = 0.84 + paperMapped * 0.24;

    pixels[index] = Math.round((168 + coolBias * 10 - warmBias * 12) * wash);
    pixels[index + 1] = Math.round((177 + coolBias * 8 + warmBias * 4) * wash);
    pixels[index + 2] = Math.round(
      (184 + coolBias * 18 - warmBias * 10) * wash,
    );
    pixels[index + 3] = 255;
  }

  imageryContext.putImageData(imageryData, 0, 0);

  context.save();

  context.save();
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
  }
  context.clip();

  context.globalCompositeOperation = 'multiply';
  context.globalAlpha = 0.62;
  context.drawImage(imageryCanvas, 0, 0);
  context.fillStyle = shiftColor(palette.countryFill, -12, -10, -6, 0.28);
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'soft-light';
  context.globalAlpha = 0.34;
  context.fillStyle = shiftColor(palette.countryFill, 24, 22, 12, 0.32);
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'screen';
  context.globalAlpha = 0.1;
  context.fillStyle = 'rgba(248, 242, 226, 0.18)';
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
  wash.addColorStop(0, shiftColor(palette.oceanFill, -8, -6, -3, 0.22));
  wash.addColorStop(0.5, shiftColor(palette.oceanFill, 3, 4, 2, 0.12));
  wash.addColorStop(1, shiftColor(palette.oceanFill, -10, -8, -5, 0.2));
  context.fillStyle = wash;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = 'multiply';
  for (let index = 0; index < 16; index += 1) {
    const x = ((index * 227) % width) + (index % 3) * 17;
    const y = ((index * 139) % height) + (index % 5) * 11;
    const radius = width * (0.035 + (index % 7) * 0.004);
    const blot = context.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    blot.addColorStop(0, shiftColor(palette.oceanDepth, -12, -10, -8, 0.04));
    blot.addColorStop(1, shiftColor(palette.oceanFill, 4, 3, 1, 0));
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'soft-light';
  for (let index = 0; index < 12; index += 1) {
    const x = ((index * 193) % width) + 8;
    const y = ((index * 101) % height) + 6;
    const radius = width * (0.022 + (index % 5) * 0.003);
    const blot = context.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    blot.addColorStop(0, shiftColor(palette.oceanHighlight, 2, 2, 0, 0.06));
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
  context.globalAlpha = 0.12;
  context.strokeStyle = 'rgba(122, 95, 65, 0.2)';
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

  context.globalAlpha = 0.08;
  context.strokeStyle = 'rgba(244, 235, 211, 0.18)';
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
  landWash.addColorStop(0, shiftColor(palette.countryFill, 8, 6, 2, 0.11));
  landWash.addColorStop(0.45, shiftColor(palette.countryFill, -8, -7, -4, 0.1));
  landWash.addColorStop(1, shiftColor(palette.countryFill, 6, 5, 2, 0.1));
  context.fillStyle = landWash;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = 'multiply';
  for (let index = 0; index < 18; index += 1) {
    const x = ((index * 181) % width) + (index % 4) * 9;
    const y = ((index * 127) % height) + (index % 6) * 7;
    const radius = width * (0.028 + (index % 6) * 0.004);
    const blot = context.createRadialGradient(
      x,
      y,
      radius * 0.15,
      x,
      y,
      radius,
    );
    blot.addColorStop(0, shiftColor(palette.countryFill, -14, -12, -8, 0.045));
    blot.addColorStop(1, shiftColor(palette.countryFill, 2, 2, 1, 0));
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'soft-light';
  for (let index = 0; index < 16; index += 1) {
    const x = ((index * 149) % width) + 5;
    const y = ((index * 113) % height) + 5;
    const radius = width * (0.016 + (index % 5) * 0.0035);
    const blot = context.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    blot.addColorStop(0, shiftColor(palette.countryFill, 14, 12, 7, 0.05));
    blot.addColorStop(1, shiftColor(palette.countryFill, 0, 0, 0, 0));
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'screen';
  context.globalAlpha = 0.08;
  context.fillStyle = 'rgba(248, 243, 229, 0.18)';
  context.fillRect(0, 0, width, height);

  context.restore();
}

function drawAtlasCoffeeStains(
  context: CanvasRenderingContext2D,
  textureCanvas: HTMLCanvasElement,
) {
  const { width, height } = textureCanvas;

  context.save();
  context.globalCompositeOperation = 'multiply';
  context.lineCap = 'round';
  context.lineJoin = 'round';

  for (const stain of [
    { x: 0.2, y: 0.24, radius: 0.12, alpha: 0.1, gap: 0.018 },
    { x: 0.74, y: 0.7, radius: 0.1, alpha: 0.08, gap: 0.014 },
  ]) {
    const cx = width * stain.x;
    const cy = height * stain.y;
    const radius = width * stain.radius;
    context.strokeStyle = `rgba(118, 84, 48, ${stain.alpha})`;
    context.lineWidth = Math.max(width * stain.gap, 1.2);
    context.beginPath();
    context.arc(cx, cy, radius, 0.2, Math.PI * 1.82);
    context.stroke();
    context.strokeStyle = `rgba(161, 122, 76, ${stain.alpha * 0.56})`;
    context.lineWidth = Math.max(width * stain.gap * 0.52, 0.8);
    context.beginPath();
    context.arc(
      cx + radius * 0.06,
      cy - radius * 0.04,
      radius * 0.76,
      0.78,
      Math.PI * 1.92,
    );
    context.stroke();
  }

  context.restore();
}

function drawAtlasMarginNotes(
  context: CanvasRenderingContext2D,
  textureCanvas: HTMLCanvasElement,
) {
  const { width, height } = textureCanvas;

  context.save();
  context.globalAlpha = 0.14;
  context.strokeStyle = 'rgba(102, 72, 39, 0.26)';
  context.lineWidth = Math.max(width / 3200, 0.6);
  context.lineCap = 'round';
  context.lineJoin = 'round';

  for (const note of [
    { x: 0.12, y: 0.17, scale: 1 },
    { x: 0.78, y: 0.28, scale: 0.9 },
    { x: 0.64, y: 0.78, scale: 0.82 },
  ]) {
    const nx = width * note.x;
    const ny = height * note.y;
    const s = width * 0.018 * note.scale;

    context.beginPath();
    context.moveTo(nx, ny);
    context.lineTo(nx + s * 1.6, ny - s * 0.35);
    context.lineTo(nx + s * 2.8, ny - s * 0.05);
    context.lineTo(nx + s * 4.1, ny - s * 0.42);
    context.stroke();

    context.beginPath();
    context.moveTo(nx + s * 0.3, ny + s * 0.65);
    context.lineTo(nx + s * 2.1, ny + s * 0.38);
    context.lineTo(nx + s * 3.4, ny + s * 0.72);
    context.lineTo(nx + s * 4.8, ny + s * 0.48);
    context.stroke();

    context.beginPath();
    context.moveTo(nx + s * 0.8, ny + s * 1.26);
    context.lineTo(nx + s * 2.5, ny + s * 0.96);
    context.lineTo(nx + s * 4.2, ny + s * 1.22);
    context.stroke();

    context.globalAlpha = 0.1;
    context.beginPath();
    context.moveTo(nx - s * 0.5, ny - s * 0.9);
    context.lineTo(nx - s * 0.1, ny + s * 1.7);
    context.stroke();
    context.globalAlpha = 0.14;
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
  context.globalAlpha = 0.2;
  context.strokeStyle = 'rgba(53, 36, 22, 0.48)';
  context.lineWidth = Math.max(textureCanvas.width / 2100, 0.92);
  context.shadowColor = 'rgba(46, 29, 18, 0.28)';
  context.shadowBlur = Math.max(textureCanvas.width / 520, 2.1);
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
  context.globalAlpha = 0.92;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.strokeStyle = 'rgba(56, 39, 24, 0.72)';
  context.lineWidth = Math.max(textureCanvas.width / 1792, 1.05);
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.stroke();
  }

  context.globalAlpha = 0.24;
  context.strokeStyle = 'rgba(115, 86, 58, 0.36)';
  context.lineWidth = Math.max(textureCanvas.width / 1420, 1.45);
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.stroke();
  }

  context.globalAlpha = 0.34;
  context.strokeStyle = 'rgba(245, 236, 213, 0.44)';
  context.lineWidth = Math.max(textureCanvas.width / 4096, 0.42);
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
  context.strokeStyle = shiftColor(palette.oceanHighlight, 6, 10, 16, 0.3);
  context.lineWidth = Math.max(textureCanvas.width / 540, 3.2);
  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.stroke();
  }

  context.globalAlpha = 0.25;
  context.strokeStyle = shiftColor(palette.oceanDepth, -12, -8, -2, 0.28);
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
  for (
    let offset = -height + spacing / 2;
    offset < width + height;
    offset += spacing
  ) {
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

  context.strokeStyle = 'rgba(112, 72, 29, 0.08)';
  context.lineWidth = Math.max(textureCanvas.width / 2800, 0.6);
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

  context.setLineDash([]);
  drawAtlasCoffeeStains(context, textureCanvas);
  drawAtlasMarginNotes(context, textureCanvas);

  context.restore();
}
