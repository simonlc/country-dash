import { memo } from 'react';
import type {
  AppThemeId,
  GlobePalette,
  GlobeQualityConfig,
} from '@/app/theme';
import { WebGlGlobe } from '@/features/game/ui/WebGlGlobe';
import type {
  CountryFeature,
  FeatureCollectionLike,
  GameMode,
  GlobeRenderer,
} from '@/features/game/types';

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
  renderer: GlobeRenderer;
  themeId: AppThemeId;
}

function GlobeComponent({
  renderer,
  ...props
}: GlobeProps) {
  void renderer;
  return <WebGlGlobe {...props} />;
}

export const Globe = memo(GlobeComponent);
