import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppThemeId, GlobePalette, GlobeQualityConfig } from '@/app/theme';
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
} from '@/utils/globeTextures';
import {
  configureTexture,
  drawGlobe,
  getTextureResolution,
  hasAmbientAnimation,
  initializeWebGl,
  type WebGlResources,
} from '@/utils/globeWebGl';

interface WebGlGlobeProps extends GlobeViewProps {
  onCipherTrafficStateChange?: (state: CipherTrafficState) => void;
  onRenderError?: (error: Error) => void;
  palette: GlobePalette;
  quality: GlobeQualityConfig;
  themeId: AppThemeId;
}

interface CachedTextureSet {
  baseTextureCanvas: HTMLCanvasElement;
  countryTextureCanvas: HTMLCanvasElement | null;
}

function getTextureCacheKey(args: {
  hasAtlasImagery: boolean;
  hasAtlasPaper: boolean;
  hasLakes: boolean;
  hasRaisedCountries: boolean;
  hasRivers: boolean;
  palette: GlobePalette;
  quality: GlobeQualityConfig;
  textureResolution: number;
  themeId: AppThemeId;
  worldFeatureCount: number;
}) {
  return JSON.stringify(args);
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
  themeId,
  onCipherTrafficStateChange,
  onRenderError,
}: WebGlGlobeProps) {
  const isAtlas = themeId === 'atlas';
  const isCipher = themeId === 'cipher';
  const cipherTrafficEndpoint =
    import.meta.env.VITE_OPENSKY_PROXY_URL?.trim() ||
    (import.meta.env.DEV ? 'http://127.0.0.1:8787/api/opensky/states' : null);
  const slowScanlineStrength = themeId === 'cipher' ? 1 : 0;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const resourcesRef = useRef<WebGlResources | null>(null);
  const drawCurrentFrameRef = useRef<
    (now?: number, includeOverlay?: boolean) => void
  >(() => undefined);
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
    atlasImageryImage,
    atlasPaperImage,
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
    themeId,
  });
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
  const cipherTrafficState = useCipherTraffic({
    enabled: isCipher,
    endpoint: cipherTrafficEndpoint,
  });
  const hasCipherOverlayAnimation = isCipher && mode !== 'capitals';
  const hasCipherTrafficAnimation =
    isCipher &&
    cipherTrafficEndpoint !== null &&
    (cipherTrafficState.status === 'live' ||
      cipherTrafficState.status === 'loading' ||
      cipherTrafficState.tracks.length > 0);
  const { interactionHandlers, isAnimating } = useGlobeInteraction({
    baseScale,
    focusDelayKey: isCipher ? roundIndex : null,
    focusDelayMs: isCipher && roundIndex > 0 ? 420 : 0,
    focusRequest,
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
  const hasCapitalBlipAnimation = mode === 'capitals';

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
    if (themeId !== 'cipher') {
      previousCipherCountryRef.current = targetFeature;
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
  }, [roundIndex, targetFeature, themeId]);

  useEffect(() => {
    if (!cipherTransition) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCipherTransition((currentTransition) =>
        currentTransition?.key === cipherTransition.key ? null : currentTransition,
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
        riversData: riversDataRef.current,
        themeId,
        trafficState: cipherTrafficState,
        transition: cipherTransitionRef.current,
        width: frameState.width,
        zoomScale: frameState.zoomScale,
      });
    },
    [cipherTrafficState, mode, themeId],
  );

  const drawCurrentFrame = useCallback(
    (now = performance.now(), includeOverlay = true) => {
      const canvas = canvasRef.current;
      const resources = resourcesRef.current;
      const frameState = frameStateRef.current;

      if (!canvas || !resources) {
        return;
      }

      const currentQuality = qualityRef.current;
      const baseReliefStrength = isAtlas ? 16 : 8;
      const reliefStrength = currentQuality.reliefMapEnabled
        ? baseReliefStrength * currentQuality.reliefHeight
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

      if (includeOverlay) {
        drawOverlayFrame(now);
      }
    },
    [drawOverlayFrame, isAtlas, reliefImage, slowScanlineStrength],
  );

  useEffect(() => {
    drawCurrentFrameRef.current = drawCurrentFrame;
  }, [drawCurrentFrame]);

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
            : 'WebGL initialization failed.';
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
      hasAtlasImagery: Boolean(atlasImageryImage),
      hasAtlasPaper: Boolean(atlasPaperImage),
      hasLakes: Boolean(lakesData),
      hasRaisedCountries,
      hasRivers: Boolean(riversData),
      palette,
      quality,
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
              isAtlas,
              isAtlas ? atlasPaperImage : null,
              isAtlas ? atlasImageryImage : null,
            )
          : buildCombinedTextureCanvas(
              world,
              null,
              palette,
              quality,
              textureResolution,
              isAtlas,
              isCipher,
              isAtlas ? atlasPaperImage : null,
              isAtlas ? atlasImageryImage : null,
              lakesData,
              riversData,
            );
        const nextCountryTextureCanvas = hasRaisedCountries
          ? buildCountryTextureCanvas(
              world,
              null,
              palette,
              quality,
              textureResolution,
              isAtlas,
              isCipher,
              isAtlas ? atlasPaperImage : null,
              isAtlas ? atlasImageryImage : null,
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

    drawCurrentFrame();

    return () => {
      cancelled = true;
    };
  }, [
    atlasImageryImage,
    atlasPaperImage,
    cityLightsImage,
    dayImageryImage,
    drawCurrentFrame,
    height,
    isAtlas,
    isCipher,
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
    onRenderError,
    themeId,
  ]);

  useEffect(() => {
    drawCurrentFrame();
  }, [criticalSites, drawCurrentFrame, height, palette, targetFeature, width]);

  useGlobeRenderLoop({
    ambientAnimationEnabled,
    drawCurrentFrame,
    hasCapitalBlipAnimation,
    hasCipherOverlayAnimation,
    hasCipherTrafficAnimation,
    isAnimating,
  });

  return (
    <div
      style={{
        background: `radial-gradient(circle at 36% 34%, ${palette.hazeInner}, ${palette.hazeOuter} 65%)`,
        height,
        overflow: 'hidden',
        position: 'relative',
        touchAction: 'none',
        width,
      }}
      {...interactionHandlers}
    >
      <div
        style={{
          background: `radial-gradient(circle at 50% 42%, ${palette.atmosphereTint}22, transparent 64%)`,
          inset: 0,
          mixBlendMode: 'screen',
          opacity: Math.min(
            0.2,
            palette.atmosphereOpacity * 0.65 + palette.auroraStrength * 0.35,
          ),
          pointerEvents: 'none',
          position: 'absolute',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          height: '100%',
          position: 'relative',
          width: '100%',
        }}
      />
      <canvas
        ref={overlayCanvasRef}
        style={{
          display: 'block',
          height: '100%',
          inset: 0,
          pointerEvents: 'none',
          position: 'absolute',
          width: '100%',
        }}
      />
      {isCipher ? <CipherTransitionOverlay transition={cipherTransition} /> : null}
    </div>
  );
}
