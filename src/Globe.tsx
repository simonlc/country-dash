import type { GlobePalette } from '@/app/theme';
import { SvgGlobe } from '@/features/game/ui/SvgGlobe';
import { WebGlGlobe } from '@/features/game/ui/WebGlGlobe';
import type {
  CountryFeature,
  FeatureCollectionLike,
  GlobeRenderer,
} from '@/features/game/types';

interface GlobeProps {
  country: CountryFeature;
  width: number;
  height: number;
  rotation: [number, number];
  focusRequest: number;
  world: FeatureCollectionLike;
  palette: GlobePalette;
  renderer: GlobeRenderer;
}

export function Globe({
  renderer,
  ...props
}: GlobeProps) {
  if (renderer === 'webgl') {
    return <WebGlGlobe {...props} />;
  }

  return <SvgGlobe {...props} />;
}
