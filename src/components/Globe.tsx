import { memo, useCallback, useEffect, useState } from 'react';
import type {
  AppThemeId,
  GlobePalette,
  GlobeQualityConfig,
} from '@/app/theme';
import { GlobeRenderError } from '@/components/GlobeRenderError';
import type { CipherTrafficState } from '@/hooks/useCipherTraffic';
import { WebGlGlobe } from '@/components/WebGlGlobe';
import type {
  CountryFeature,
  FeatureCollectionLike,
  GameMode,
} from '@/types/game';

interface GlobeProps {
  country: CountryFeature;
  mode: GameMode;
  width: number;
  height: number;
  rotation: [number, number];
  focusRequest: number;
  world: FeatureCollectionLike;
  palette: GlobePalette;
  quality: GlobeQualityConfig;
  themeId: AppThemeId;
  onCipherTrafficStateChange?: (state: CipherTrafficState) => void;
}

function GlobeComponent(props: GlobeProps) {
  const [renderError, setRenderError] = useState<Error | null>(null);
  const handleRenderError = useCallback((error: Error) => {
    setRenderError(error);
  }, []);

  useEffect(() => {
    setRenderError(null);
  }, [
    props.country.id,
    props.focusRequest,
    props.height,
    props.mode,
    props.themeId,
    props.width,
  ]);

  if (renderError) {
    return <GlobeRenderError message={renderError.message} />;
  }

  return <WebGlGlobe {...props} onRenderError={handleRenderError} />;
}

export const Globe = memo(GlobeComponent);
