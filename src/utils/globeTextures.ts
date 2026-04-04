import {
  geoEquirectangular,
  geoGraticule10,
  geoPath,
  type GeoPermissibleObjects,
} from 'd3';
import type {
  GlobePalette,
  GlobeQualityConfig,
  GlobeRenderConfig,
} from '@/app/theme';
import type { FeatureCollectionLike } from '@/types/game';
import {
  applyAtlasBiomeWatercolor,
  applyAtlasCoastalWash,
  applyAtlasInkBleed,
  applyAtlasInkCoastline,
  applyAtlasOceanCurrentHatching,
  applyAtlasParchmentAging,
  applyAtlasWatercolorLand,
  applyAtlasWatercolorOcean,
  drawAtlasExpeditionDetails,
} from '@/utils/globeAtlasTextures';
import { parseCssColor } from '@/utils/globeColors';
import {
  drawHydroLayers,
  type HydroFeatureCollection,
} from '@/utils/globeHydroOverlays';

export interface PreparedCityLightsMaps {
  glow: HTMLCanvasElement;
  pollution: HTMLCanvasElement;
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getScaledImageDimensions(image: HTMLImageElement, maxWidth: number) {
  const scale = Math.min(1, maxWidth / Math.max(image.naturalWidth, 1));

  return {
    height: Math.max(1, Math.round(image.naturalHeight * scale)),
    width: Math.max(1, Math.round(image.naturalWidth * scale)),
  };
}

function drawWrappedImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  for (let copy = 0; copy < 3; copy += 1) {
    context.drawImage(image, copy * width, 0, width, height);
  }
}

function buildWrappedBlurPassCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
  blurPx: number,
) {
  const sourceCanvas = createCanvas(width * 3, height);
  const sourceContext = sourceCanvas.getContext('2d');
  if (!sourceContext) {
    throw new Error('Failed to create city lights source canvas.');
  }

  drawWrappedImage(sourceContext, image, width, height);

  const blurredCanvas = createCanvas(width * 3, height);
  const blurredContext = blurredCanvas.getContext('2d');
  if (!blurredContext) {
    throw new Error('Failed to create city lights blur canvas.');
  }

  if (blurPx > 0) {
    blurredContext.filter = `blur(${blurPx}px)`;
  }
  blurredContext.drawImage(sourceCanvas, 0, 0);
  blurredContext.filter = 'none';

  const passCanvas = createCanvas(width, height);
  const passContext = passCanvas.getContext('2d');
  if (!passContext) {
    throw new Error('Failed to create city lights pass canvas.');
  }

  passContext.drawImage(
    blurredCanvas,
    width,
    0,
    width,
    height,
    0,
    0,
    width,
    height,
  );

  return passCanvas;
}

function getBloomPasses(radius: number) {
  return [
    {
      blurPx: Math.max(radius * 0.38, 0.55),
      opacity: 0.36,
    },
    {
      blurPx: Math.max(radius * 0.78, 0.95),
      opacity: 0.31,
    },
    {
      blurPx: Math.max(radius * 1.45, 1.45),
      opacity: 0.21,
    },
    {
      blurPx: Math.max(radius * 2.2, 2.2),
      opacity: 0.12,
    },
  ];
}

function buildCityLightsCompositeTextureCanvas(args: {
  image: HTMLImageElement;
  layers: Array<{
    opacity: number;
    radius: number;
  }>;
  maxWidth: number;
}) {
  const { image, layers, maxWidth } = args;
  const { height, width } = getScaledImageDimensions(image, maxWidth);
  const textureCanvas = createCanvas(width, height);
  const context = textureCanvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to create city lights texture canvas.');
  }

  for (const layer of layers) {
    const layerCanvas = createCanvas(width, height);
    const layerContext = layerCanvas.getContext('2d');
    if (!layerContext) {
      throw new Error('Failed to create city lights layer canvas.');
    }

    for (const pass of getBloomPasses(layer.radius)) {
      const passCanvas = buildWrappedBlurPassCanvas(
        image,
        width,
        height,
        pass.blurPx,
      );
      layerContext.save();
      layerContext.globalAlpha = pass.opacity;
      layerContext.drawImage(passCanvas, 0, 0);
      layerContext.restore();
    }

    context.save();
    context.globalAlpha = layer.opacity;
    context.drawImage(layerCanvas, 0, 0);
    context.restore();
  }

  return textureCanvas;
}

export function prepareCityLightsMaps(
  image: HTMLImageElement,
  args: {
    cityLightsGlow: number;
    lightPollutionSpread: number;
  },
): PreparedCityLightsMaps {
  return {
    glow: buildCityLightsCompositeTextureCanvas({
      image,
      layers: [
        {
          opacity: 1,
          radius: 0.85 + args.cityLightsGlow * 1.1,
        },
      ],
      maxWidth: 1024,
    }),
    pollution: buildCityLightsCompositeTextureCanvas({
      image,
      layers: [
        {
          opacity: 0.52,
          radius: 2.6 + args.lightPollutionSpread * 3.1,
        },
        {
          opacity: 0.48,
          radius: 5.2 + args.lightPollutionSpread * 5.1,
        },
      ],
      maxWidth: 768,
    }),
  };
}

function drawFeatureFills(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  fillStyle: string,
) {
  context.fillStyle = fillStyle;

  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.fill();
  }
}

function drawFeatureStrokes(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  strokeStyle: string,
  lineWidth: number,
) {
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;

  for (const feature of world.features) {
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.stroke();
  }
}

function applyCountryDeboss(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  palette: GlobePalette,
) {
  if (palette.countryDebossStrength <= 0) {
    return;
  }

  for (const feature of world.features) {
    context.save();
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.clip();

    context.globalAlpha = palette.countryDebossStrength;
    context.lineJoin = 'round';
    context.lineWidth = palette.countryDebossWidth;

    context.translate(
      -palette.countryDebossOffset,
      -palette.countryDebossOffset,
    );
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.strokeStyle = palette.countryDebossLight;
    context.stroke();

    context.translate(
      -palette.countryDebossOffset * 2,
      -palette.countryDebossOffset * 2,
    );
    context.beginPath();
    path(feature as GeoPermissibleObjects);
    context.strokeStyle = palette.countryDebossDark;
    context.stroke();

    context.restore();
  }
}

function applyCountryShadow(
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  world: FeatureCollectionLike,
  palette: GlobePalette,
) {
  if (palette.countryShadowBlur <= 0) {
    return;
  }

  const isRaisedShadow = palette.countryElevation > 0;
  const steps = isRaisedShadow
    ? Math.max(14, Math.min(56, Math.round(palette.countryShadowBlur * 1.2)))
    : 1;
  const baseAlpha = parseCssColor(palette.countryShadowColor).alpha;
  const shadowRgb = parseCssColor(palette.countryShadowColor).rgb;
  const blurSpread = Math.max(palette.countryShadowBlur * 0.14, 1.2);
  const baseOffsetX = isRaisedShadow ? 0 : palette.countryShadowOffsetX;
  const baseOffsetY = isRaisedShadow ? 0 : palette.countryShadowOffsetY;

  context.save();
  context.fillStyle = `rgba(${shadowRgb[0]}, ${shadowRgb[1]}, ${shadowRgb[2]}, ${baseAlpha})`;

  for (let step = 0; step < steps; step += 1) {
    const progress = (step + 1) / steps;
    const angle = (step / steps) * Math.PI * 2;
    const radialDistance = isRaisedShadow
      ? Math.sqrt(progress) * blurSpread
      : 0;
    const alphaScale = isRaisedShadow
      ? Math.pow(1 - step / steps, 1.45) * 0.09
      : 1;
    const offsetX = baseOffsetX + Math.cos(angle) * radialDistance;
    const offsetY = baseOffsetY + Math.sin(angle) * radialDistance;

    context.save();
    context.translate(offsetX, offsetY);
    context.globalAlpha = alphaScale;

    for (const feature of world.features) {
      context.beginPath();
      path(feature as GeoPermissibleObjects);
      context.fill();
    }

    context.restore();
  }

  context.restore();
}

function withTextureContext(
  canvas: HTMLCanvasElement,
  draw: (context: CanvasRenderingContext2D) => void,
) {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to create globe texture context.');
  }

  draw(context);
}

function drawWithOpacity(
  context: CanvasRenderingContext2D,
  opacity: number,
  draw: () => void,
) {
  if (opacity <= 0) {
    return;
  }

  context.save();
  context.globalAlpha *= opacity;
  draw();
  context.restore();
}

export function buildOceanTextureCanvas(
  world: FeatureCollectionLike,
  palette: GlobePalette,
  textureSize: number,
  render: GlobeRenderConfig,
) {
  const textureCanvas = createCanvas(textureSize, textureSize / 2);

  withTextureContext(textureCanvas, (context) => {
    context.fillStyle = palette.oceanFill;
    context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
    if (render.atlasStyleEnabled && render.atlasBiomeWatercolorOpacity > 0) {
      const projection = geoEquirectangular()
        .translate([textureCanvas.width / 2, textureCanvas.height / 2])
        .scale(textureCanvas.width / (2 * Math.PI));
      const path = geoPath(projection, context);
      drawWithOpacity(context, render.atlasBiomeWatercolorOpacity, () => {
        applyAtlasBiomeWatercolor(
          context,
          path,
          world,
          textureCanvas,
        );
      });
    }
    if (render.atlasStyleEnabled && render.atlasWatercolorOceanOpacity > 0) {
      drawWithOpacity(context, render.atlasWatercolorOceanOpacity, () => {
        applyAtlasWatercolorOcean(context, textureCanvas, palette);
      });
    }
    if (
      render.atlasStyleEnabled &&
      render.atlasOceanCurrentHatchingOpacity > 0
    ) {
      drawWithOpacity(context, render.atlasOceanCurrentHatchingOpacity, () => {
        applyAtlasOceanCurrentHatching(context, textureCanvas);
      });
    }
    if (render.atlasStyleEnabled && render.atlasParchmentAgingOpacity > 0) {
      drawWithOpacity(context, render.atlasParchmentAgingOpacity, () => {
        applyAtlasParchmentAging(context, textureCanvas, palette);
      });
    }

    if (
      render.atlasStyleEnabled &&
      (render.atlasCoastalWashOpacity > 0 ||
        render.atlasInkCoastlineOpacity > 0 ||
        render.atlasInkBleedOpacity > 0)
    ) {
      const projection = geoEquirectangular()
        .translate([textureCanvas.width / 2, textureCanvas.height / 2])
        .scale(textureCanvas.width / (2 * Math.PI));
      const path = geoPath(projection, context);
      if (render.atlasCoastalWashOpacity > 0) {
        drawWithOpacity(context, render.atlasCoastalWashOpacity, () => {
          applyAtlasCoastalWash(context, path, world, textureCanvas, palette);
        });
      }
      if (render.atlasInkCoastlineOpacity > 0) {
        drawWithOpacity(context, render.atlasInkCoastlineOpacity, () => {
          applyAtlasInkCoastline(context, path, world, textureCanvas);
        });
      }
      if (render.atlasInkBleedOpacity > 0) {
        drawWithOpacity(context, render.atlasInkBleedOpacity, () => {
          applyAtlasInkBleed(context, path, world, textureCanvas);
        });
      }
    }

    if (palette.countryElevation > 0) {
      const projection = geoEquirectangular()
        .translate([textureCanvas.width / 2, textureCanvas.height / 2])
        .scale(textureCanvas.width / (2 * Math.PI));
      const path = geoPath(projection, context);
      applyCountryShadow(context, path, world, palette);
    }
  });

  return textureCanvas;
}

export function buildCombinedTextureCanvas(
  world: FeatureCollectionLike,
  palette: GlobePalette,
  quality: GlobeQualityConfig,
  textureSize: number,
  render: GlobeRenderConfig,
  lakesData: HydroFeatureCollection | null,
  riversData: HydroFeatureCollection | null,
) {
  const textureCanvas = createCanvas(textureSize, textureSize / 2);

  withTextureContext(textureCanvas, (context) => {
    const projection = geoEquirectangular()
      .translate([textureCanvas.width / 2, textureCanvas.height / 2])
      .scale(textureCanvas.width / (2 * Math.PI));
    const path = geoPath(projection, context);
    context.fillStyle = palette.oceanFill;
    context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

    if (render.atlasStyleEnabled && render.atlasWatercolorOceanOpacity > 0) {
      drawWithOpacity(context, render.atlasWatercolorOceanOpacity, () => {
        applyAtlasWatercolorOcean(context, textureCanvas, palette);
      });
    }
    if (
      render.atlasStyleEnabled &&
      render.atlasOceanCurrentHatchingOpacity > 0
    ) {
      drawWithOpacity(context, render.atlasOceanCurrentHatchingOpacity, () => {
        applyAtlasOceanCurrentHatching(context, textureCanvas);
      });
    }
    if (render.atlasStyleEnabled && render.atlasParchmentAgingOpacity > 0) {
      drawWithOpacity(context, render.atlasParchmentAgingOpacity, () => {
        applyAtlasParchmentAging(context, textureCanvas, palette);
      });
    }
    if (render.atlasStyleEnabled && render.atlasExpeditionDetailsOpacity > 0) {
      drawWithOpacity(context, render.atlasExpeditionDetailsOpacity, () => {
        drawAtlasExpeditionDetails(context, path, textureCanvas);
      });
    }
    if (render.atlasStyleEnabled && render.atlasWatercolorLandOpacity > 0) {
      drawWithOpacity(context, render.atlasWatercolorLandOpacity, () => {
        applyAtlasWatercolorLand(context, path, world, textureCanvas);
      });
    }
    if (render.atlasStyleEnabled && render.atlasBiomeWatercolorOpacity > 0) {
      drawWithOpacity(context, render.atlasBiomeWatercolorOpacity, () => {
        applyAtlasBiomeWatercolor(
          context,
          path,
          world,
          textureCanvas,
        );
      });
    }
    if (render.atlasStyleEnabled && render.atlasCoastalWashOpacity > 0) {
      drawWithOpacity(context, render.atlasCoastalWashOpacity, () => {
        applyAtlasCoastalWash(context, path, world, textureCanvas, palette);
      });
    }

    if (!render.atlasStyleEnabled || render.atlasGraticuleOpacity > 0) {
      context.beginPath();
      path(geoGraticule10());
      context.strokeStyle = palette.graticule;
      context.globalAlpha = render.atlasStyleEnabled
        ? render.atlasGraticuleOpacity
        : 1;
      context.lineWidth = render.atlasStyleEnabled
        ? render.atlasGraticuleLineWidth
        : render.standardGraticuleLineWidth;
      if (
        render.atlasStyleEnabled &&
        render.atlasGraticuleDashLength > 0 &&
        render.atlasGraticuleGapLength > 0
      ) {
        context.setLineDash([
          render.atlasGraticuleDashLength,
          render.atlasGraticuleGapLength,
        ]);
      }
      context.stroke();
      context.setLineDash([]);
      context.globalAlpha = 1;
    }

    applyCountryShadow(context, path, world, palette);
    if (!render.atlasStyleEnabled) {
      drawFeatureFills(context, path, world, palette.countryFill);
    }
    drawHydroLayers({
      context,
      render,
      lakesData,
      path,
      quality,
      riversData,
      textureCanvas,
    });
    drawFeatureStrokes(
      context,
      path,
      world,
      palette.countryStroke,
      render.atlasStyleEnabled
        ? render.atlasCountryStrokeWidth
        : render.standardCountryStrokeWidth,
    );
    if (render.atlasStyleEnabled && render.atlasInkCoastlineOpacity > 0) {
      drawWithOpacity(context, render.atlasInkCoastlineOpacity, () => {
        applyAtlasInkCoastline(context, path, world, textureCanvas);
      });
    }
    if (render.atlasStyleEnabled && render.atlasInkBleedOpacity > 0) {
      drawWithOpacity(context, render.atlasInkBleedOpacity, () => {
        applyAtlasInkBleed(context, path, world, textureCanvas);
      });
    }
    applyCountryDeboss(context, path, world, palette);
  });

  return textureCanvas;
}

export function buildCountryTextureCanvas(
  world: FeatureCollectionLike,
  palette: GlobePalette,
  quality: GlobeQualityConfig,
  textureSize: number,
  render: GlobeRenderConfig,
  lakesData: HydroFeatureCollection | null,
  riversData: HydroFeatureCollection | null,
) {
  const textureCanvas = createCanvas(textureSize, textureSize / 2);

  withTextureContext(textureCanvas, (context) => {
    const projection = geoEquirectangular()
      .translate([textureCanvas.width / 2, textureCanvas.height / 2])
      .scale(textureCanvas.width / (2 * Math.PI));
    const path = geoPath(projection, context);
    context.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
    if (render.atlasStyleEnabled && render.atlasParchmentAgingOpacity > 0) {
      drawWithOpacity(context, render.atlasParchmentAgingOpacity, () => {
        applyAtlasParchmentAging(context, textureCanvas, palette);
      });
    }
    if (render.atlasStyleEnabled && render.atlasExpeditionDetailsOpacity > 0) {
      drawWithOpacity(context, render.atlasExpeditionDetailsOpacity, () => {
        drawAtlasExpeditionDetails(context, path, textureCanvas);
      });
    }
    if (render.atlasStyleEnabled && render.atlasWatercolorLandOpacity > 0) {
      drawWithOpacity(context, render.atlasWatercolorLandOpacity, () => {
        applyAtlasWatercolorLand(context, path, world, textureCanvas);
      });
    }
    if (render.atlasStyleEnabled && render.atlasBiomeWatercolorOpacity > 0) {
      drawWithOpacity(context, render.atlasBiomeWatercolorOpacity, () => {
        applyAtlasBiomeWatercolor(
          context,
          path,
          world,
          textureCanvas,
        );
      });
    }
    if (render.atlasStyleEnabled && render.atlasCoastalWashOpacity > 0) {
      drawWithOpacity(context, render.atlasCoastalWashOpacity, () => {
        applyAtlasCoastalWash(context, path, world, textureCanvas, palette);
      });
    }
    if (!render.atlasStyleEnabled || render.atlasGraticuleOpacity > 0) {
      context.beginPath();
      path(geoGraticule10());
      context.strokeStyle = palette.graticule;
      context.globalAlpha = render.atlasStyleEnabled
        ? render.atlasGraticuleOpacity
        : 1;
      context.lineWidth = render.atlasStyleEnabled
        ? render.atlasGraticuleLineWidth
        : render.standardGraticuleLineWidth;
      if (
        render.atlasStyleEnabled &&
        render.atlasGraticuleDashLength > 0 &&
        render.atlasGraticuleGapLength > 0
      ) {
        context.setLineDash([
          render.atlasGraticuleDashLength,
          render.atlasGraticuleGapLength,
        ]);
      }
      context.stroke();
      context.setLineDash([]);
      context.globalAlpha = 1;
    }

    if (!render.atlasStyleEnabled) {
      drawFeatureFills(context, path, world, palette.countryFill);
    }
    drawHydroLayers({
      context,
      render,
      lakesData,
      path,
      quality,
      riversData,
      textureCanvas,
    });
    drawFeatureStrokes(
      context,
      path,
      world,
      palette.countryStroke,
      render.atlasStyleEnabled
        ? render.atlasCountryStrokeWidth
        : render.standardCountryStrokeWidth,
    );
    if (render.atlasStyleEnabled && render.atlasInkCoastlineOpacity > 0) {
      drawWithOpacity(context, render.atlasInkCoastlineOpacity, () => {
        applyAtlasInkCoastline(context, path, world, textureCanvas);
      });
    }
    if (render.atlasStyleEnabled && render.atlasInkBleedOpacity > 0) {
      drawWithOpacity(context, render.atlasInkBleedOpacity, () => {
        applyAtlasInkBleed(context, path, world, textureCanvas);
      });
    }
    applyCountryDeboss(context, path, world, palette);
  });

  return textureCanvas;
}
