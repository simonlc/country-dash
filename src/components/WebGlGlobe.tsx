import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AppThemeId,
  GlobePalette,
  GlobeQualityConfig,
  GlobeRenderConfig,
} from '@/app/theme';
import { CipherTransitionOverlay } from '@/components/CipherTransitionOverlay';
import {
  useCipherTraffic,
  type CipherTrafficState,
} from '@/hooks/useCipherTraffic';
import { useGlobeAssets } from '@/hooks/useGlobeAssets';
import { useGlobeRenderLoop } from '@/hooks/useGlobeRenderLoop';
import type { CountryFeature } from '@/types/game';
import {
  cipherCountryTransitionDurationMs,
  type CipherCountryTransition,
  type CipherCriticalSite,
} from '@/utils/globeCipherOverlays';
import type { HydroFeatureCollection } from '@/utils/globeHydroOverlays';
import { drawSelectedCountryOverlay } from '@/utils/globeOverlays';
import { useGlobeInteraction, type GlobeViewProps } from '@/utils/globeShared';
import {
  buildCombinedTextureCanvas,
  buildCountryTextureCanvas,
  buildOceanTextureCanvas,
  type GlobeTextureRenderConfig,
} from '@/utils/globeTextures';
import {
  configureTexture,
  disposeWebGl,
  drawGlobe,
  getTextureResolution,
  hasAmbientAnimation,
  initializeWebGl,
  type WebGlResources,
} from '@/utils/globeWebGl';
import { m } from '@/paraglide/messages.js';

interface WebGlGlobeProps extends GlobeViewProps {
  onCipherTrafficStateChange?: (state: CipherTrafficState) => void;
  onRenderError?: (error: Error) => void;
  palette: GlobePalette;
  quality: GlobeQualityConfig;
  render: GlobeRenderConfig;
  themeId: AppThemeId;
}

interface CachedTextureSet {
  baseTextureCanvas: HTMLCanvasElement;
  countryTextureCanvas: HTMLCanvasElement | null;
}

const textureCacheVersion = 3;

function getTextureCacheKey(args: {
  hasLakes: boolean;
  hasRaisedCountries: boolean;
  hasRivers: boolean;
  palette: GlobePalette;
  quality: GlobeQualityConfig;
  render: GlobeTextureRenderConfig;
  textureResolution: number;
  themeId: AppThemeId;
  worldFeatureCount: number;
}) {
  return JSON.stringify({
    textureCacheVersion,
    ...args,
  });
}

function setCachedTextures(
  cache: Map<string, CachedTextureSet>,
  key: string,
  value: CachedTextureSet,
) {
  if (!cache.has(key) && cache.size >= 12) {
    const oldestKey = cache.keys().next().value;
    if (typeof oldestKey === 'string') {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, value);
}

function updateTextureFromImage(
  gl: WebGLRenderingContext,
  texture: WebGLTexture,
  unit: number,
  image: HTMLImageElement,
) {
  gl.activeTexture(unit);
  configureTexture(gl, texture, image.naturalWidth, image.naturalHeight);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.activeTexture(gl.TEXTURE0);
}

function updateTextureFromCanvas(
  gl: WebGLRenderingContext,
  texture: WebGLTexture,
  unit: number,
  canvas: HTMLCanvasElement,
) {
  gl.activeTexture(unit);
  configureTexture(gl, texture, canvas.width, canvas.height);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.activeTexture(gl.TEXTURE0);
}

export function WebGlGlobe({
  country,
  mode,
  width,
  height,
  roundIndex,
  rotation,
  focusRequest,
  world,
  palette,
  quality,
  render,
  themeId,
  onCipherTrafficStateChange,
  onRenderError,
}: WebGlGlobeProps) {
  const transitionEnabled =
    render.cipherCountryTransitionOpacity > 0 ||
    render.cipherScreenTransitionOverlayOpacity > 0;
  const cipherTrafficEndpoint =
    import.meta.env.VITE_OPENSKY_PROXY_URL?.trim() ||
    (import.meta.env.DEV ? 'http://127.0.0.1:8787/api/opensky/states' : null);
  const slowScanlineStrength = render.slowScanlineStrength;
  const textureRenderConfig = useMemo<GlobeTextureRenderConfig>(
    () => ({
      atlasBiomeWatercolorOpacity: render.atlasBiomeWatercolorOpacity,
      atlasCoastalWashOpacity: render.atlasCoastalWashOpacity,
      atlasCountryStrokeWidth: render.atlasCountryStrokeWidth,
      atlasExpeditionDetailsOpacity: render.atlasExpeditionDetailsOpacity,
      atlasGraticuleDashLength: render.atlasGraticuleDashLength,
      atlasGraticuleGapLength: render.atlasGraticuleGapLength,
      atlasGraticuleLineWidth: render.atlasGraticuleLineWidth,
      atlasGraticuleOpacity: render.atlasGraticuleOpacity,
      atlasInkBleedOpacity: render.atlasInkBleedOpacity,
      atlasInkCoastlineOpacity: render.atlasInkCoastlineOpacity,
      atlasOceanCurrentHatchingOpacity: render.atlasOceanCurrentHatchingOpacity,
      atlasParchmentAgingOpacity: render.atlasParchmentAgingOpacity,
      atlasStyleEnabled: render.atlasStyleEnabled,
      atlasWatercolorLandOpacity: render.atlasWatercolorLandOpacity,
      atlasWatercolorOceanOpacity: render.atlasWatercolorOceanOpacity,
      cipherHydroTextureEffectOpacity: render.cipherHydroTextureEffectOpacity,
      standardCountryStrokeWidth: render.standardCountryStrokeWidth,
      standardGraticuleLineWidth: render.standardGraticuleLineWidth,
    }),
    [
      render.atlasBiomeWatercolorOpacity,
      render.atlasCoastalWashOpacity,
      render.atlasCountryStrokeWidth,
      render.atlasExpeditionDetailsOpacity,
      render.atlasGraticuleDashLength,
      render.atlasGraticuleGapLength,
      render.atlasGraticuleLineWidth,
      render.atlasGraticuleOpacity,
      render.atlasInkBleedOpacity,
      render.atlasInkCoastlineOpacity,
      render.atlasOceanCurrentHatchingOpacity,
      render.atlasParchmentAgingOpacity,
      render.atlasStyleEnabled,
      render.atlasWatercolorLandOpacity,
      render.atlasWatercolorOceanOpacity,
      render.cipherHydroTextureEffectOpacity,
      render.standardCountryStrokeWidth,
      render.standardGraticuleLineWidth,
    ],
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const resourcesRef = useRef<WebGlResources | null>(null);
  const drawCurrentFrameRef = useRef<(now?: number) => void>(() => undefined);
  const targetFeatureRef = useRef<CountryFeature>(country);
  const previousCipherCountryRef = useRef<CountryFeature | null>(null);
  const criticalSitesRef = useRef<CipherCriticalSite[]>([]);
  const cipherTransitionRef = useRef<CipherCountryTransition | null>(null);
  const lakesDataRef = useRef<HydroFeatureCollection | null>(null);
  const riversDataRef = useRef<HydroFeatureCollection | null>(null);
  const textureCacheRef = useRef(new Map<string, CachedTextureSet>());
  const frameStateRef = useRef({
    currentRotation: rotation,
    height,
    width,
    zoomScale: 1,
  });
  const paletteRef = useRef(palette);
  const qualityRef = useRef(quality);
  const [cipherTransition, setCipherTransition] =
    useState<CipherCountryTransition | null>(null);
  const {
    cityLightsImage,
    criticalSites,
    dayImageryImage,
    lakesData,
    nightImageryImage,
    preparedCityLightsMaps,
    reliefImage,
    riversData,
    waterMaskImage,
  } = useGlobeAssets({
    quality,
    render,
  });
  const baseScale = useMemo(
    () => Math.max(Math.min(width, height) / 2 - 10, 1),
    [height, width],
  );
  const worldFeaturesById = useMemo(
    () =>
      new Map(world.features.map((feature) => [feature.id, feature] as const)),
    [world.features],
  );
  const targetFeature = useMemo(
    () => worldFeaturesById.get(country.id) ?? country,
    [country, worldFeaturesById],
  );
  const cipherTrafficState = useCipherTraffic({
    enabled: render.cipherTrafficOverlayOpacity > 0,
    endpoint:
      render.cipherTrafficOverlayOpacity > 0 ? cipherTrafficEndpoint : null,
  });
  const hasCipherOverlayAnimation =
    mode !== 'capitals' &&
    (render.cipherHydroOverlayOpacity > 0 ||
      render.cipherMapAnnotationsOpacity > 0 ||
      render.cipherSelectedCountryOverlayOpacity > 0 ||
      (render.cipherCountryTransitionOpacity > 0 && cipherTransition !== null));
  const hasCipherTrafficAnimation =
    render.cipherTrafficOverlayOpacity > 0 &&
    (criticalSites.length > 0 ||
      (cipherTrafficEndpoint !== null &&
        (cipherTrafficState.status === 'live' ||
          cipherTrafficState.status === 'loading' ||
          cipherTrafficState.tracks.length > 0)));
  const initialZoomScale = width <= 900 ? 1.2 : 1;
  const { interactionHandlers, isAnimating } = useGlobeInteraction({
    baseScale,
    focusDelayKey: render.cipherFocusDelayMs > 0 ? roundIndex : null,
    focusDelayMs: roundIndex > 0 ? render.cipherFocusDelayMs : 0,
    focusRequest,
    initialZoomScale,
    onFrame: ({ rotation: nextRotation, zoomScale: nextZoomScale }) => {
      frameStateRef.current = {
        currentRotation: nextRotation,
        height,
        width,
        zoomScale: nextZoomScale,
      };
      drawCurrentFrameRef.current();
    },
    pointerDirection: { x: 1, y: 1 },
    rotation,
    useStateUpdates: false,
  });
  const ambientAnimationEnabled = useMemo(
    () => hasAmbientAnimation(palette),
    [palette],
  );
  const hasCapitalBlipAnimation =
    mode === 'capitals' &&
    typeof targetFeature.properties.capitalLongitude === 'number' &&
    typeof targetFeature.properties.capitalLatitude === 'number';

  useEffect(() => {
    frameStateRef.current = {
      currentRotation: frameStateRef.current.currentRotation,
      height,
      width,
      zoomScale: frameStateRef.current.zoomScale,
    };
  }, [height, width]);

  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

  useEffect(() => {
    qualityRef.current = quality;
  }, [quality]);

  useEffect(() => {
    targetFeatureRef.current = targetFeature;
  }, [targetFeature]);

  useEffect(() => {
    cipherTransitionRef.current = cipherTransition;
  }, [cipherTransition]);

  useEffect(() => {
    lakesDataRef.current = lakesData;
  }, [lakesData]);

  useEffect(() => {
    riversDataRef.current = riversData;
  }, [riversData]);

  useEffect(() => {
    criticalSitesRef.current = criticalSites;
  }, [criticalSites]);

  useEffect(() => {
    if (!transitionEnabled) {
      previousCipherCountryRef.current = targetFeature;
      cipherTransitionRef.current = null;
      queueMicrotask(() => {
        setCipherTransition(null);
      });
      return;
    }

    const previousCountry = previousCipherCountryRef.current;
    previousCipherCountryRef.current = targetFeature;

    if (
      !previousCountry ||
      previousCountry.id === targetFeature.id ||
      roundIndex <= 0
    ) {
      return;
    }

    const startedAtMs = performance.now();
    const nextTransition = {
      fromCountry: previousCountry,
      key: `${previousCountry.id}:${targetFeature.id}:${startedAtMs}`,
      startedAtMs,
      toCountry: targetFeature,
    } satisfies CipherCountryTransition;
    cipherTransitionRef.current = nextTransition;
    setCipherTransition(nextTransition);
    drawCurrentFrameRef.current(startedAtMs);
  }, [roundIndex, targetFeature, transitionEnabled]);

  useEffect(() => {
    if (!cipherTransition) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCipherTransition((currentTransition) =>
        currentTransition?.key === cipherTransition.key
          ? null
          : currentTransition,
      );
      drawCurrentFrameRef.current();
    }, cipherCountryTransitionDurationMs + 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [cipherTransition]);

  useEffect(() => {
    onCipherTrafficStateChange?.(cipherTrafficState);
  }, [cipherTrafficState, onCipherTrafficStateChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const preventGesture: EventListener = (event) => {
      event.preventDefault();
    };
    const preventPinchTouch = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };

    container.addEventListener('gesturestart', preventGesture);
    container.addEventListener('gesturechange', preventGesture);
    container.addEventListener('gestureend', preventGesture);
    container.addEventListener('touchmove', preventPinchTouch, {
      passive: false,
    });

    return () => {
      container.removeEventListener('gesturestart', preventGesture);
      container.removeEventListener('gesturechange', preventGesture);
      container.removeEventListener('gestureend', preventGesture);
      container.removeEventListener('touchmove', preventPinchTouch);
    };
  }, []);

  const drawOverlayFrame = useCallback(
    (now = performance.now()) => {
      const overlayCanvas = overlayCanvasRef.current;
      const frameState = frameStateRef.current;

      if (!overlayCanvas) {
        return;
      }

      drawSelectedCountryOverlay({
        canvas: overlayCanvas,
        criticalSites: criticalSitesRef.current,
        country: targetFeatureRef.current,
        currentRotation: frameState.currentRotation,
        height: frameState.height,
        lakesData: lakesDataRef.current,
        mode,
        nowMs: now,
        palette: paletteRef.current,
        quality: qualityRef.current,
        render,
        riversData: riversDataRef.current,
        trafficState: cipherTrafficState,
        transition: cipherTransitionRef.current,
        width: frameState.width,
        zoomScale: frameState.zoomScale,
      });
    },
    [cipherTrafficState, mode, render],
  );

  const drawBaseFrame = useCallback(
    (now = performance.now()) => {
      const canvas = canvasRef.current;
      const resources = resourcesRef.current;
      const frameState = frameStateRef.current;

      if (!canvas || !resources) {
        return;
      }

      const currentQuality = qualityRef.current;
      const reliefStrength = currentQuality.reliefMapEnabled
        ? render.reliefStrengthMultiplier * currentQuality.reliefHeight
        : 0;

      drawGlobe(
        resources,
        canvas,
        frameState.width,
        frameState.height,
        frameState.zoomScale,
        frameState.currentRotation,
        paletteRef.current,
        currentQuality,
        slowScanlineStrength,
        now * 0.001,
        reliefStrength,
        reliefImage
          ? [1 / reliefImage.naturalWidth, 1 / reliefImage.naturalHeight]
          : [1 / 2048, 1 / 1024],
      );
    },
    [reliefImage, render.reliefStrengthMultiplier, slowScanlineStrength],
  );

  const drawCurrentFrame = useCallback(
    (now = performance.now()) => {
      drawBaseFrame(now);
      drawOverlayFrame(now);
    },
    [drawBaseFrame, drawOverlayFrame],
  );

  useEffect(() => {
    drawCurrentFrameRef.current = drawCurrentFrame;
  }, [drawCurrentFrame]);

  useEffect(
    () => () => {
      const resources = resourcesRef.current;
      if (!resources) {
        return;
      }

      disposeWebGl(resources);
      resourcesRef.current = null;
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let cancelled = false;

    if (!resourcesRef.current) {
      try {
        resourcesRef.current = initializeWebGl(canvas);
      } catch (error) {
        const nextMessage =
          error instanceof Error
            ? error.message
            : m.error_webgl_initialization_failed();
        window.setTimeout(() => {
          if (!cancelled) {
            onRenderError?.(new Error(nextMessage));
          }
        }, 0);
        return;
      }
    }

    const resources = resourcesRef.current;
    if (!resources) {
      return;
    }

    const gl = resources.gl;
    const textureResolution = getTextureResolution(gl, width, height);
    const hasRaisedCountries = palette.countryElevation > 0;
    const textureCacheKey = getTextureCacheKey({
      hasLakes: Boolean(lakesData),
      hasRaisedCountries,
      hasRivers: Boolean(riversData),
      palette,
      quality,
      render: textureRenderConfig,
      textureResolution,
      themeId,
      worldFeatureCount: world.features.length,
    });
    const cachedTextures = textureCacheRef.current.get(textureCacheKey);
    const { baseTextureCanvas, countryTextureCanvas } =
      cachedTextures ??
      (() => {
        const nextBaseTextureCanvas = hasRaisedCountries
          ? buildOceanTextureCanvas(
              world,
              palette,
              textureResolution,
              textureRenderConfig,
            )
          : buildCombinedTextureCanvas(
              world,
              palette,
              quality,
              textureResolution,
              textureRenderConfig,
              lakesData,
              riversData,
            );
        const nextCountryTextureCanvas = hasRaisedCountries
          ? buildCountryTextureCanvas(
              world,
              palette,
              quality,
              textureResolution,
              textureRenderConfig,
              lakesData,
              riversData,
            )
          : null;
        const nextTextures = {
          baseTextureCanvas: nextBaseTextureCanvas,
          countryTextureCanvas: nextCountryTextureCanvas,
        };

        setCachedTextures(
          textureCacheRef.current,
          textureCacheKey,
          nextTextures,
        );

        return nextTextures;
      })();

    updateTextureFromCanvas(
      gl,
      resources.texture,
      gl.TEXTURE0,
      baseTextureCanvas,
    );

    if (countryTextureCanvas) {
      updateTextureFromCanvas(
        gl,
        resources.overlayTexture,
        gl.TEXTURE0,
        countryTextureCanvas,
      );
    }

    if (reliefImage) {
      updateTextureFromImage(
        gl,
        resources.reliefTexture,
        gl.TEXTURE1,
        reliefImage,
      );
    }

    if (cityLightsImage) {
      updateTextureFromImage(
        gl,
        resources.cityLightsTexture,
        gl.TEXTURE2,
        cityLightsImage,
      );
    }

    if (preparedCityLightsMaps) {
      updateTextureFromCanvas(
        gl,
        resources.cityLightsGlowTexture,
        gl.TEXTURE3,
        preparedCityLightsMaps.glow,
      );
      updateTextureFromCanvas(
        gl,
        resources.cityLightsPollutionTexture,
        gl.TEXTURE4,
        preparedCityLightsMaps.pollution,
      );
    }

    if (dayImageryImage) {
      updateTextureFromImage(
        gl,
        resources.dayTexture,
        gl.TEXTURE5,
        dayImageryImage,
      );
    }

    if (nightImageryImage) {
      updateTextureFromImage(
        gl,
        resources.nightTexture,
        gl.TEXTURE6,
        nightImageryImage,
      );
    }

    if (waterMaskImage) {
      updateTextureFromImage(
        gl,
        resources.waterMaskTexture,
        gl.TEXTURE7,
        waterMaskImage,
      );
    }

    drawCurrentFrameRef.current();

    return () => {
      cancelled = true;
    };
  }, [
    cityLightsImage,
    dayImageryImage,
    height,
    lakesData,
    nightImageryImage,
    palette,
    preparedCityLightsMaps,
    quality,
    reliefImage,
    riversData,
    waterMaskImage,
    width,
    world,
    themeId,
    textureRenderConfig,
    onRenderError,
  ]);

  useEffect(() => {
    drawOverlayFrame();
  }, [criticalSites, drawOverlayFrame, targetFeature]);

  useGlobeRenderLoop({
    ambientAnimationEnabled,
    drawBaseFrame,
    drawOverlayFrame,
    hasCapitalBlipAnimation,
    hasCipherOverlayAnimation,
    hasCipherTrafficAnimation,
    isAnimating,
  });

  return (
    <div
      className="globe-shell relative h-full w-full overflow-hidden touch-none"
      data-theme-id={themeId}
      ref={containerRef}
      {...interactionHandlers}
    >
      <div
        className="globe-atmosphere pointer-events-none absolute inset-0 mix-blend-screen"
        data-theme-id={themeId}
      />
      <canvas className="relative block h-full w-full" ref={canvasRef} />
      <canvas
        className="pointer-events-none absolute inset-0 block h-full w-full"
        ref={overlayCanvasRef}
      />
      {render.cipherScreenTransitionOverlayOpacity > 0 ? (
        <CipherTransitionOverlay
          opacity={render.cipherScreenTransitionOverlayOpacity}
          transition={cipherTransition}
        />
      ) : null}
    </div>
  );
}
