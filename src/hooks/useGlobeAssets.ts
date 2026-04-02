import { useEffect, useState } from 'react';
import type { AppThemeId, GlobeQualityConfig } from '@/app/theme';
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

function useOptionalImageAsset(path: string, enabled: boolean) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      setImage(null);
      return;
    }

    let cancelled = false;
    const nextImage = new Image();
    nextImage.decoding = 'async';
    nextImage.onload = () => {
      if (!cancelled) {
        setImage(nextImage);
      }
    };
    nextImage.onerror = () => {
      if (!cancelled) {
        setImage(null);
      }
    };
    nextImage.src = path;

    return () => {
      cancelled = true;
    };
  }, [enabled, path]);

  return image;
}

interface UseGlobeAssetsArgs {
  quality: GlobeQualityConfig;
  themeId: AppThemeId;
}

export function useGlobeAssets({ quality, themeId }: UseGlobeAssetsArgs) {
  const isAtlas = themeId === 'atlas';
  const isCipher = themeId === 'cipher';
  const reliefImage = useOptionalImageAsset(
    '/textures/world-relief.png',
    quality.reliefMapEnabled,
  );
  const atlasPaperImage = useOptionalImageAsset(
    '/textures/atlas-paper.jpg',
    isAtlas,
  );
  const atlasImageryImage = useOptionalImageAsset(
    '/textures/world-imagery.jpg',
    isAtlas,
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
      setPreparedCityLightsMaps(null);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      try {
        setPreparedCityLightsMaps(
          prepareCityLightsMaps(cityLightsImage, {
            cityLightsGlow: quality.cityLightsGlow,
            lightPollutionSpread: quality.lightPollutionSpread,
          }),
        );
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
    void loadHydroFeatureCollection('/data/ne-110m-lakes.geojson')
      .then((data) => {
        if (!cancelled) {
          setLakesData(data);
        }
      })
      .catch(() => {
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
    void loadHydroFeatureCollection('/data/ne-110m-rivers.geojson')
      .then((data) => {
        if (!cancelled) {
          setRiversData(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRiversData(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [quality.showRivers, riversData]);

  useEffect(() => {
    if (!isCipher || criticalSites.length > 0) {
      return;
    }

    let cancelled = false;
    void loadCipherCriticalSites('/data/cipher-critical-sites.json')
      .then((data) => {
        if (!cancelled) {
          setCriticalSites(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCriticalSites([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [criticalSites.length, isCipher]);

  return {
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
  };
}
