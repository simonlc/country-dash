import { screen } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appThemes } from '@/app/theme';
import { renderWithProviders } from '@/test/render';
import { Globe } from './Globe';
import type { CountryFeature, FeatureCollectionLike } from '@/types/game';

const { mockState } = vi.hoisted(() => ({
  mockState: {
    shouldFail: false,
  },
}));

vi.mock('@/components/WebGlGlobe', () => ({
  WebGlGlobe: ({
    onRenderError,
  }: {
    onRenderError?: (error: Error) => void;
  }) => {
    useEffect(() => {
      if (mockState.shouldFail) {
        const timeoutId = window.setTimeout(() => {
          onRenderError?.(new Error('WebGL unavailable'));
        }, 0);

        return () => {
          window.clearTimeout(timeoutId);
        };
      }
    }, [onRenderError]);

    return <div data-testid="webgl-globe" />;
  },
}));

function createCountry(): CountryFeature {
  return {
    id: 'CA',
    type: 'Feature',
    properties: {
      continent: 'North America',
      isocode: 'CA',
      isocode3: 'CAN',
      nameEn: 'Canada',
      region: 'North America',
      subregion: 'Northern America',
      tags: [],
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ],
      ],
    },
  };
}

const country = createCountry();
const world: FeatureCollectionLike = {
  type: 'FeatureCollection',
  features: [country],
};
const activeTheme = appThemes[0]!;

describe('Globe', () => {
  beforeEach(() => {
    mockState.shouldFail = false;
  });

  it('renders the WebGL renderer path', () => {
    renderWithProviders(
      <Globe
        country={country}
        focusRequest={0}
        height={400}
        mode="classic"
        palette={activeTheme.globe}
        quality={activeTheme.qualityDefaults}
        rotation={[0, 0]}
        themeId={activeTheme.id}
        width={400}
        world={world}
      />,
    );

    expect(screen.getByTestId('webgl-globe')).toBeVisible();
  });

  it('shows a localized error state when the renderer reports a failure', async () => {
    mockState.shouldFail = true;

    renderWithProviders(
      <Globe
        country={country}
        focusRequest={0}
        height={400}
        mode="classic"
        palette={activeTheme.globe}
        quality={activeTheme.qualityDefaults}
        rotation={[0, 0]}
        themeId={activeTheme.id}
        width={400}
        world={world}
      />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'WebGL unavailable',
    );
  });
});
