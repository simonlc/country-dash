import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appThemes, createAppTheme } from '@/app/theme';
import {
  worldDataAtom,
  focusRequestAtom,
  cipherTrafficStateAtom,
} from '@/game/state/game-atoms';
import {
  currentCountryAtom,
  gameModeAtom,
  isCapitalModeAtom,
  roundIndexAtom,
  viewportVisualHeightAtom,
  viewportWidthAtom,
} from '@/game/state/game-derived-atoms';
import { renderWithProviders } from '@/test/render';
import type { CountryFeature, WorldData } from '@/types/game';
import { GlobeVertical } from './GlobeVertical';

const {
  globeMock,
  setCipherTrafficStateMock,
  useAtomValueMock,
  useSetAtomMock,
} = vi.hoisted(() => ({
  globeMock: vi.fn(
    ({ height, width }: { height: number; width: number }) => (
      <div data-height={String(height)} data-testid="globe" data-width={String(width)} />
    ),
  ),
  setCipherTrafficStateMock: vi.fn(),
  useAtomValueMock: vi.fn(),
  useSetAtomMock: vi.fn(),
}));

vi.mock('jotai', async () => {
  const actual = await vi.importActual<typeof import('jotai')>('jotai');
  return {
    ...actual,
    useAtomValue: useAtomValueMock,
    useSetAtom: useSetAtomMock,
  };
});

vi.mock('@/app/appearance', async () => {
  const actual = await vi.importActual<typeof import('@/app/appearance')>(
    '@/app/appearance'
  );
  return {
    ...actual,
    useAppearance: () => ({
      activeTheme: appThemes[0],
      uiTheme: createAppTheme(appThemes[0]!.id),
    }),
  };
});

vi.mock('@/components/GameBackground', () => ({
  GameBackground: () => <div data-testid="game-background" />,
}));

vi.mock('@/components/Globe', () => ({
  Globe: globeMock,
}));

vi.mock('@/components/GlobeAdminPanel', () => ({
  GlobeAdminPanel: () => null,
}));

vi.mock('@/hooks/useGlobeAdminTuning', () => ({
  useGlobeAdminTuning: () => ({
    adminEnabled: false,
    effectiveSettings: {
      globe: appThemes[0]!.globe,
      quality: appThemes[0]!.qualityDefaults,
      render: appThemes[0]!.render,
    },
    resetAdminOverride: vi.fn(),
    resetRevision: 0,
    setAdminOverridePatch: vi.fn(),
  }),
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
const worldData: WorldData = {
  world: {
    type: 'FeatureCollection',
    features: [country],
  },
};

describe('GlobeVertical', () => {
  beforeEach(() => {
    globeMock.mockClear();
    setCipherTrafficStateMock.mockClear();
    useSetAtomMock.mockReturnValue(setCipherTrafficStateMock);
    useAtomValueMock.mockImplementation((atom) => {
      if (atom === viewportWidthAtom) {
        return 390;
      }

      if (atom === viewportVisualHeightAtom) {
        return 480;
      }

      if (atom === worldDataAtom) {
        return worldData;
      }

      if (atom === focusRequestAtom) {
        return 0;
      }

      if (atom === gameModeAtom) {
        return 'classic';
      }

      if (atom === roundIndexAtom) {
        return 0;
      }

      if (atom === currentCountryAtom) {
        return country;
      }

      if (atom === isCapitalModeAtom) {
        return false;
      }

      if (atom === cipherTrafficStateAtom) {
        return null;
      }

      return undefined;
    });
  });

  it('constrains the globe container to the available visual height', () => {
    renderWithProviders(<GlobeVertical />);

    const globe = screen.getByTestId('globe');
    expect(globe).toHaveAttribute('data-height', '480');
    expect(globe).toHaveAttribute('data-width', '390');
    expect(globe.parentElement).toHaveStyle({ height: '480px' });
  });
});
