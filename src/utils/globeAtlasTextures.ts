import { geoCircle, geoPath, type GeoPermissibleObjects } from 'd3';
import type { GlobePalette } from '@/app/theme';
import type { FeatureCollectionLike } from '@/types/game';
import { shiftColor } from '@/utils/globeColors';

function clipToAtlasLand(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
) {
  context.beginPath();
  for (const feature of world.features) {
    path(feature as GeoPermissibleObjects);
  }
  context.clip();
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

export function applyAtlasBiomeWatercolor(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  textureCanvas: HTMLCanvasElement,
  palette: GlobePalette,
  atlasImageryImage: HTMLImageElement | null,
) {
  const { width, height } = textureCanvas;
  context.save();
  context.save();
  clipToAtlasLand(context, path, world);

  if (atlasImageryImage) {
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 0.28;
    context.filter =
      'blur(2.1px) sepia(0.52) saturate(0.86) hue-rotate(-8deg) contrast(0.88) brightness(1.2)';
    context.drawImage(atlasImageryImage, 0, 0, width, height);
    context.filter = 'none';

    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 0.22;
    context.fillStyle = 'rgba(232, 212, 176, 0.3)';
    context.fillRect(0, 0, width, height);

    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 0.16;
    context.fillStyle = 'rgba(241, 226, 195, 0.22)';
    context.fillRect(0, 0, width, height);
  }

  const toTexturePoint = (longitude: number, latitude: number) => ({
    x: ((longitude + 180) / 360) * width,
    y: ((90 - latitude) / 180) * height,
  });

  const paintGreenUnderwash = (
    regions: Array<{
      latitude: number;
      longitude: number;
      radius: number;
      strength: number;
    }>,
  ) => {
    context.globalCompositeOperation = 'soft-light';
    context.filter = `blur(${Math.max(width / 72, 18)}px)`;
    for (const region of regions) {
      const { x, y } = toTexturePoint(region.longitude, region.latitude);
      const radius = width * region.radius;
      const gradient = context.createRadialGradient(
        x,
        y,
        radius * 0.1,
        x,
        y,
        radius,
      );
      gradient.addColorStop(0, `rgba(132, 164, 84, ${region.strength})`);
      gradient.addColorStop(
        0.62,
        `rgba(154, 182, 110, ${region.strength * 0.45})`,
      );
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.filter = 'none';
  };

  const paintBiomeBlobs = (
    color: string,
    regions: Array<{
      latitude: number;
      longitude: number;
      radius: number;
      strength: number;
    }>,
  ) => {
    context.globalCompositeOperation = 'source-over';
    context.filter = `blur(${Math.max(width / 110, 12)}px)`;
    for (const region of regions) {
      const { x, y } = toTexturePoint(region.longitude, region.latitude);
      const radius = width * region.radius;
      const gradient = context.createRadialGradient(
        x,
        y,
        radius * 0.18,
        x,
        y,
        radius,
      );
      gradient.addColorStop(0, color.replace('ALPHA', String(region.strength)));
      gradient.addColorStop(
        0.62,
        color.replace('ALPHA', String(region.strength * 0.52)),
      );
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.filter = 'none';
  };

  const paintAccentBlobs = (
    color: string,
    regions: Array<{
      latitude: number;
      longitude: number;
      radius: number;
      strength: number;
    }>,
  ) => {
    context.globalCompositeOperation = 'source-over';
    context.filter = `blur(${Math.max(width / 90, 14)}px)`;
    for (const region of regions) {
      const { x, y } = toTexturePoint(region.longitude, region.latitude);
      const radius = width * region.radius;
      const gradient = context.createRadialGradient(
        x,
        y,
        radius * 0.08,
        x,
        y,
        radius,
      );
      gradient.addColorStop(0, color.replace('ALPHA', String(region.strength)));
      gradient.addColorStop(0.55, color.replace('ALPHA', String(region.strength * 0.45)));
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.filter = 'none';
  };

  paintGreenUnderwash([
    { longitude: -60, latitude: -8, radius: 0.16, strength: 0.18 },
    { longitude: 23, latitude: -2, radius: 0.12, strength: 0.15 },
    { longitude: 106, latitude: 8, radius: 0.14, strength: 0.14 },
    { longitude: -86, latitude: 39, radius: 0.11, strength: 0.09 },
    { longitude: 18, latitude: 48, radius: 0.08, strength: 0.06 },
  ]);

  paintBiomeBlobs('rgba(114, 176, 58, ALPHA)', [
    { longitude: -63, latitude: -7, radius: 0.106, strength: 0.38 },
    { longitude: 22, latitude: 0, radius: 0.082, strength: 0.34 },
    { longitude: 105, latitude: 11, radius: 0.094, strength: 0.33 },
    { longitude: -84, latitude: 37, radius: 0.078, strength: 0.2 },
    { longitude: 18, latitude: 50, radius: 0.058, strength: 0.16 },
  ]);

  paintBiomeBlobs('rgba(230, 186, 92, ALPHA)', [
    { longitude: 13, latitude: 23, radius: 0.116, strength: 0.3 },
    { longitude: 48, latitude: 24, radius: 0.072, strength: 0.24 },
    { longitude: 133, latitude: -24, radius: 0.088, strength: 0.3 },
    { longitude: 102, latitude: 42, radius: 0.064, strength: 0.14 },
    { longitude: -112, latitude: 34, radius: 0.048, strength: 0.14 },
  ]);

  paintBiomeBlobs('rgba(205, 161, 98, ALPHA)', [
    { longitude: -71, latitude: -19, radius: 0.05, strength: 0.1 },
    { longitude: -110, latitude: 42, radius: 0.056, strength: 0.08 },
    { longitude: 86, latitude: 31, radius: 0.074, strength: 0.11 },
    { longitude: 11, latitude: 46, radius: 0.03, strength: 0.06 },
  ]);

  paintBiomeBlobs('rgba(210, 191, 147, ALPHA)', [
    { longitude: -42, latitude: 74, radius: 0.088, strength: 0.08 },
    { longitude: -102, latitude: 69, radius: 0.084, strength: 0.06 },
    { longitude: 105, latitude: 71, radius: 0.112, strength: 0.05 },
  ]);

  paintAccentBlobs('rgba(235, 148, 54, ALPHA)', [
    { longitude: 18, latitude: 18, radius: 0.068, strength: 0.16 },
    { longitude: 136, latitude: -23, radius: 0.06, strength: 0.17 },
    { longitude: -67, latitude: -21, radius: 0.046, strength: 0.12 },
  ]);

  paintAccentBlobs('rgba(86, 175, 68, ALPHA)', [
    { longitude: -60, latitude: -6, radius: 0.086, strength: 0.24 },
    { longitude: 24, latitude: -2, radius: 0.072, strength: 0.21 },
    { longitude: 108, latitude: 10, radius: 0.074, strength: 0.21 },
    { longitude: -47, latitude: -14, radius: 0.06, strength: 0.16 },
    { longitude: 30, latitude: -8, radius: 0.056, strength: 0.14 },
  ]);

  paintAccentBlobs('rgba(86, 160, 191, ALPHA)', [
    { longitude: -73, latitude: -11, radius: 0.044, strength: 0.11 },
    { longitude: 36, latitude: -4, radius: 0.042, strength: 0.1 },
    { longitude: 113, latitude: 0, radius: 0.044, strength: 0.11 },
  ]);

  paintAccentBlobs('rgba(208, 180, 126, ALPHA)', [
    { longitude: -44, latitude: 72, radius: 0.074, strength: 0.05 },
    { longitude: -100, latitude: 68, radius: 0.07, strength: 0.04 },
    { longitude: 102, latitude: 72, radius: 0.1, strength: 0.04 },
  ]);

  paintAccentBlobs('rgba(193, 160, 102, ALPHA)', [
    { longitude: 58, latitude: 61, radius: 0.084, strength: 0.04 },
    { longitude: 96, latitude: 57, radius: 0.09, strength: 0.04 },
    { longitude: -108, latitude: 58, radius: 0.078, strength: 0.04 },
  ]);

  const antarcticSnow = context.createLinearGradient(0, height * 0.78, 0, height);
  antarcticSnow.addColorStop(0, 'rgba(204, 183, 141, 0)');
  antarcticSnow.addColorStop(1, 'rgba(204, 183, 141, 0.06)');
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 1;
  context.fillStyle = antarcticSnow;
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = 'soft-light';
  context.globalAlpha = 0.12;
  context.fillStyle = 'rgba(234, 214, 181, 0.2)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 0.16;
  context.fillStyle = 'rgba(241, 225, 193, 0.16)';
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

  context.globalCompositeOperation = 'multiply';
  context.globalAlpha = 0.14;
  context.strokeStyle = 'rgba(102, 117, 120, 0.28)';
  context.lineWidth = Math.max(width / 3600, 0.45);
  for (let band = 0; band < 7; band += 1) {
    const startY = height * (0.12 + band * 0.12);
    context.beginPath();
    for (let x = -24; x <= width + 24; x += 18) {
      const wave =
        Math.sin((x / width) * Math.PI * (2.2 + band * 0.28) + band * 0.8) *
          (5 + band * 0.5) +
        Math.sin((x / width) * Math.PI * 8.0 + band * 1.7) * 1.2;
      const y = startY + wave;
      if (x <= -24) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();
  }

  context.globalCompositeOperation = 'soft-light';
  context.globalAlpha = 0.1;
  context.strokeStyle = 'rgba(236, 233, 216, 0.22)';
  context.lineWidth = Math.max(width / 5200, 0.28);
  for (let band = 0; band < 5; band += 1) {
    const startY = height * (0.18 + band * 0.16);
    context.beginPath();
    for (let x = -18; x <= width + 18; x += 16) {
      const wave = Math.sin((x / width) * Math.PI * (3.4 + band * 0.3) + band) * 2.4;
      const y = startY + wave;
      if (x <= -18) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();
  }

  context.globalCompositeOperation = 'multiply';
  context.globalAlpha = 0.08;
  context.fillStyle = 'rgba(112, 120, 118, 0.2)';
  for (let index = 0; index < 220; index += 1) {
    const x = ((index * 137) % width) + 3;
    const y = ((index * 89) % height) + 2;
    const size = 0.55 + (index % 3) * 0.35;
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
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
) {
  const { width, height } = textureCanvas;

  context.save();
  clipToAtlasLand(context, path, world);

  const landWash = context.createLinearGradient(0, 0, width, height);
  landWash.addColorStop(0, 'rgba(232, 223, 196, 0.22)');
  landWash.addColorStop(0.45, 'rgba(221, 207, 176, 0.2)');
  landWash.addColorStop(1, 'rgba(230, 221, 194, 0.22)');
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
    blot.addColorStop(0, 'rgba(174, 152, 110, 0.02)');
    blot.addColorStop(1, 'rgba(0, 0, 0, 0)');
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
    blot.addColorStop(0, 'rgba(242, 230, 197, 0.09)');
    blot.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = blot;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'screen';
  context.globalAlpha = 0.16;
  context.fillStyle = 'rgba(250, 246, 235, 0.3)';
  context.fillRect(0, 0, width, height);

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
  clipToAtlasLand(context, path, world);

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
  drawAtlasMarginNotes(context, textureCanvas);

  context.restore();
}
