import { memo, useCallback, useMemo, useState } from 'react';
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
  roundIndex: number;
  rotation: [number, number];
  focusRequest: number;
  world: FeatureCollectionLike;
  palette: GlobePalette;
  quality: GlobeQualityConfig;
  themeId: AppThemeId;
  onCipherTrafficStateChange?: (state: CipherTrafficState) => void;
}

function GlobeComponent(props: GlobeProps) {
  const [renderError, setRenderError] = useState<{
    error: Error;
    resetKey: string;
  } | null>(null);
  const resetKey = useMemo(
    () =>
      [
        props.country.id,
        props.focusRequest,
        props.height,
        props.mode,
        props.roundIndex,
        props.themeId,
        props.width,
      ].join(':'),
    [
      props.country.id,
      props.focusRequest,
      props.height,
      props.mode,
      props.roundIndex,
      props.themeId,
      props.width,
    ],
  );
  const handleRenderError = useCallback((error: Error) => {
    setRenderError({
      error,
      resetKey,
    });
  }, [resetKey]);

  if (renderError?.resetKey === resetKey) {
    return <GlobeRenderError message={renderError.error.message} />;
  }

  return <WebGlGlobe {...props} onRenderError={handleRenderError} />;
}

export const Globe = memo(GlobeComponent);
