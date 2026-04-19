import { useEffect, useState } from 'react';
import type { GlobeQualityConfig, GlobeRenderConfig } from '@/app/theme';
import {
  loadCipherCriticalSites,
  type CipherCriticalSite,
} from '@/utils/globeCipherOverlays';
import {
  loadHydroFeatureCollection,
  type HydroFeatureCollection,
} from '@/utils/globeHydroOverlays';
import {
  prepareCityLightsMaps,
  type PreparedCityLightsMaps,
} from '@/utils/globeTextures';

const imageAssetCache = new Map<string, Promise<HTMLImageElement>>();
const hydroFeatureCollectionCache = new Map<
  string,
  Promise<HydroFeatureCollection>
>();
const criticalSitesCache = new Map<string, Promise<CipherCriticalSite[]>>();
const cityLightsMapsCache = new Map<string, PreparedCityLightsMaps>();
const maxCityLightsMapsCacheEntries = 4;

function setCachedCityLightsMaps(
  key: string,
  value: PreparedCityLightsMaps,
) {
  if (!cityLightsMapsCache.has(key) &&
      cityLightsMapsCache.size >= maxCityLightsMapsCacheEntries) {
    const oldestKey = cityLightsMapsCache.keys().next().value;
    if (typeof oldestKey === 'string') {
      cityLightsMapsCache.delete(oldestKey);
    }
  }

  cityLightsMapsCache.set(key, value);
}

function loadImageAsset(path: string) {
  const cachedImage = imageAssetCache.get(path);
  if (cachedImage) {
    return cachedImage;
  }

  const imagePromise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      imageAssetCache.delete(path);
      reject(new Error(`Failed to load image asset: ${path}`));
    };
    image.src = path;
  });

  imageAssetCache.set(path, imagePromise);
  return imagePromise;
}

function useOptionalImageAsset(path: string, enabled: boolean) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() => {
        setImage(null);
      });
      return;
    }

    let cancelled = false;
    void loadImageAsset(path)
      .then((nextImage) => {
        if (!cancelled) {
          setImage(nextImage);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImage(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, path]);

  return image;
}

interface UseGlobeAssetsArgs {
  quality: GlobeQualityConfig;
  render: GlobeRenderConfig;
}

export function useGlobeAssets({ quality, render }: UseGlobeAssetsArgs) {
  const reliefImage = useOptionalImageAsset(
    '/textures/world-relief.png',
    quality.reliefMapEnabled,
  );
  const cityLightsImage = useOptionalImageAsset(
    '/textures/world-city-lights.jpg',
    quality.cityLightsEnabled || quality.lightPollutionEnabled,
  );
  const dayImageryImage = useOptionalImageAsset(
    '/textures/world-imagery.jpg',
    quality.dayImageryEnabled,
  );
  const nightImageryImage = useOptionalImageAsset(
    '/textures/world-night.jpg',
    quality.nightImageryEnabled,
  );
  const waterMaskImage = useOptionalImageAsset(
    '/textures/world-water-mask.png',
    quality.waterMaskEnabled,
  );
  const [preparedCityLightsMaps, setPreparedCityLightsMaps] =
    useState<PreparedCityLightsMaps | null>(null);
  const [lakesData, setLakesData] = useState<HydroFeatureCollection | null>(null);
  const [riversData, setRiversData] = useState<HydroFeatureCollection | null>(null);
  const [criticalSites, setCriticalSites] = useState<CipherCriticalSite[]>([]);

  useEffect(() => {
    if (
      !cityLightsImage ||
      (!quality.cityLightsEnabled && !quality.lightPollutionEnabled)
    ) {
      queueMicrotask(() => {
        setPreparedCityLightsMaps(null);
      });
      return;
    }

    const cacheKey = [
      cityLightsImage.currentSrc || cityLightsImage.src,
      quality.cityLightsGlow,
      quality.lightPollutionSpread,
    ].join(':');
    const cachedMaps = cityLightsMapsCache.get(cacheKey);
    if (cachedMaps) {
      queueMicrotask(() => {
        setPreparedCityLightsMaps(cachedMaps);
      });
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      try {
        const preparedMaps = prepareCityLightsMaps(cityLightsImage, {
          cityLightsGlow: quality.cityLightsGlow,
          lightPollutionSpread: quality.lightPollutionSpread,
        });
        setCachedCityLightsMaps(cacheKey, preparedMaps);
        setPreparedCityLightsMaps(preparedMaps);
      } catch {
        setPreparedCityLightsMaps(null);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    cityLightsImage,
    quality.cityLightsEnabled,
    quality.cityLightsGlow,
    quality.lightPollutionEnabled,
    quality.lightPollutionSpread,
  ]);

  useEffect(() => {
    if (!quality.showLakes || lakesData) {
      return;
    }

    let cancelled = false;
    const path = '/data/ne-110m-lakes.geojson';
    const dataPromise =
      hydroFeatureCollectionCache.get(path) ??
      loadHydroFeatureCollection(path);
    hydroFeatureCollectionCache.set(path, dataPromise);

    void dataPromise
      .then((data) => {
        if (!cancelled) {
          setLakesData(data);
        }
      })
      .catch(() => {
        hydroFeatureCollectionCache.delete(path);
        if (!cancelled) {
          setLakesData(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lakesData, quality.showLakes]);

  useEffect(() => {
    if (!quality.showRivers || riversData) {
      return;
    }

    let cancelled = false;
    const path = '/data/ne-110m-rivers.geojson';
    const dataPromise =
      hydroFeatureCollectionCache.get(path) ??
      loadHydroFeatureCollection(path);
    hydroFeatureCollectionCache.set(path, dataPromise);

    void dataPromise
      .then((data) => {
        if (!cancelled) {
          setRiversData(data);
        }
      })
      .catch(() => {
        hydroFeatureCollectionCache.delete(path);
        if (!cancelled) {
          setRiversData(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [quality.showRivers, riversData]);

  useEffect(() => {
    if (render.cipherTrafficOverlayOpacity <= 0 || criticalSites.length > 0) {
      return;
    }

    let cancelled = false;
    const path = '/data/cipher-critical-sites.json';
    const dataPromise =
      criticalSitesCache.get(path) ?? loadCipherCriticalSites(path);
    criticalSitesCache.set(path, dataPromise);

    void dataPromise
      .then((data) => {
        if (!cancelled) {
          setCriticalSites(data);
        }
      })
      .catch(() => {
        criticalSitesCache.delete(path);
        if (!cancelled) {
          setCriticalSites([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [criticalSites.length, render.cipherTrafficOverlayOpacity]);

  return {
    cityLightsImage,
    criticalSites,
    dayImageryImage,
    lakesData,
    nightImageryImage,
    preparedCityLightsMaps,
    reliefImage,
    riversData,
    waterMaskImage,
  };
}
