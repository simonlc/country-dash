import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { PropsWithChildren } from 'react';
import { loadWorldData } from '@/features/game/data/loadWorldData';
import { renderWithProviders } from '@/test/render';
import { GamePage } from './GamePage';
import type { CountryFeature, FeatureCollectionLike, WorldData } from '@/features/game/types';

const { showModalMock } = vi.hoisted(() => ({
  showModalMock: vi.fn(),
}));

vi.mock('@ebay/nice-modal-react', () => ({
  __esModule: true,
  default: {
    Provider: ({ children }: PropsWithChildren) => <>{children}</>,
    create: <T,>(component: T) => component,
    show: showModalMock,
  },
  create: <T,>(component: T) => component,
  useModal: () => ({
    hide: () => Promise.resolve(),
    visible: true,
  }),
}));

vi.mock('@/Globe', () => ({
  Globe: () => <div data-testid="globe" />,
}));

vi.mock('@/features/game/data/loadWorldData', () => ({
  loadWorldData: vi.fn(),
}));

function createCountry(args: {
  id: string;
  name: string;
  isocode: string;
  isocode3: string;
  continent: string;
  subregion: string;
  tags?: Array<'microstate' | 'islandNation' | 'caribbean' | 'middleEast'>;
}): CountryFeature {
  return {
    id: args.id,
    type: 'Feature',
    properties: {
      continent: args.continent,
      isocode: args.isocode,
      isocode3: args.isocode3,
      nameEn: args.name,
      region: args.continent,
      subregion: args.subregion,
      tags: args.tags ?? [],
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

const world: FeatureCollectionLike = {
  type: 'FeatureCollection',
  features: [
    createCountry({
      id: 'CA',
      name: 'Canada',
      isocode: 'CA',
      isocode3: 'CAN',
      continent: 'North America',
      subregion: 'Northern America',
    }),
    createCountry({
      id: 'JP',
      name: 'Japan',
      isocode: 'JP',
      isocode3: 'JPN',
      continent: 'Asia',
      subregion: 'Eastern Asia',
      tags: ['islandNation'],
    }),
    createCountry({
      id: 'QA',
      name: 'Qatar',
      isocode: 'QA',
      isocode3: 'QAT',
      continent: 'Asia',
      subregion: 'Western Asia',
      tags: ['middleEast'],
    }),
    createCountry({
      id: 'BZ',
      name: 'Belize',
      isocode: 'BZ',
      isocode3: 'BLZ',
      continent: 'North America',
      subregion: 'Central America',
      tags: ['caribbean'],
    }),
    createCountry({
      id: 'NR',
      name: 'Nauru',
      isocode: 'NR',
      isocode3: 'NRU',
      continent: 'Oceania',
      subregion: 'Micronesia',
      tags: ['microstate', 'islandNation'],
    }),
  ],
};

const mockedLoadWorldData = vi.mocked(loadWorldData);

function createStorage() {
  const store = new Map<string, string>();

  return {
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('GamePage', () => {
  beforeEach(() => {
    cleanup();
    showModalMock.mockReset();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createStorage(),
    });
    mockedLoadWorldData.mockResolvedValue({
      world,
    } satisfies WorldData);
  });

  async function getIntroHandlers() {
    renderWithProviders(<GamePage />);

    await waitFor(() => {
      expect(showModalMock).toHaveBeenCalled();
    });

    const introArgs = showModalMock.mock.calls[0]?.[1] as {
      onStartDaily: () => void;
      onStartRandom: (options: {
        mode: 'classic' | 'threeLives' | 'capitals' | 'streak';
        regionFilter:
          | 'africa'
          | 'asia'
          | 'europe'
          | 'northAmerica'
          | 'southAmerica'
          | 'oceania'
          | 'microstates'
          | 'islandNations'
          | 'caribbean'
          | 'middleEast'
          | null;
        countrySizeFilter: 'large' | 'mixed' | 'small';
      }) => void;
    };

    return introArgs;
  }

  it('shows the new intro flow and supports a filtered run', async () => {
    const user = userEvent.setup();
    const intro = await getIntroHandlers();

    await act(async () => {
      intro.onStartRandom({
        mode: 'classic',
        regionFilter: 'asia',
        countrySizeFilter: 'mixed',
      });
    });

    expect(await screen.findByText(/Guess the highlighted country/i)).toBeVisible();
    expect(screen.getByText(/Type: Random Run/i)).toBeVisible();
    expect(screen.getByText(/Mode: Classic/i)).toBeVisible();
    expect(screen.getByText(/Pool: Asia/i)).toBeVisible();
    await user.click(screen.getByRole('button', { name: /refocus country/i }));
  });

  it('accepts a typed wrong answer and shows the review screen', async () => {
    const user = userEvent.setup();
    const intro = await getIntroHandlers();

    await act(async () => {
      intro.onStartRandom({
        mode: 'classic',
        regionFilter: null,
        countrySizeFilter: 'mixed',
      });
    });

    const input = await screen.findByLabelText(/guess the country/i);
    await user.type(input, 'Atlantis');
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect');
    expect(screen.getByText(/You guessed: Atlantis/i)).toBeVisible();
  });

  it('supports retry and quit from the menu', async () => {
    const user = userEvent.setup();
    const intro = await getIntroHandlers();

    await act(async () => {
      intro.onStartRandom({
        mode: 'classic',
        regionFilter: 'asia',
        countrySizeFilter: 'mixed',
      });
    });

    expect(await screen.findByText(/Guess the highlighted country/i)).toBeVisible();
    await user.click(screen.getByRole('button', { name: /^menu$/i }));
    await user.click(screen.getByRole('button', { name: /^retry$/i }));

    expect(await screen.findByText(/Guess the highlighted country/i)).toBeVisible();
    expect(screen.getByText(/Type: Random Run/i)).toBeVisible();

    await user.click(screen.getByRole('button', { name: /^quit$/i }));
    await waitFor(() => {
      expect(showModalMock).toHaveBeenCalledTimes(2);
    });
  });

  it('stores and locks the daily challenge after completion', async () => {
    const user = userEvent.setup();
    const intro = await getIntroHandlers();
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText,
      },
    });

    await act(async () => {
      intro.onStartDaily();
    });

    for (let round = 0; round < 5; round += 1) {
      const input = await screen.findByLabelText(/guess the country/i);
      await user.clear(input);
      await user.type(input, `Atlantis ${round}`);
      fireEvent.submit(input.closest('form') as HTMLFormElement);
      const advanceButtons = await screen.findAllByRole('button', { name: /next|finish/i });
      await user.click(advanceButtons.at(-1) ?? advanceButtons[0]!);
    }

    const finalButtons = screen.queryAllByRole('button', { name: /finish/i });
    if (finalButtons.length > 0) {
      await user.click(finalButtons.at(-1) ?? finalButtons[0]!);
    }

    expect(await screen.findByRole('button', { name: /main menu/i })).toBeVisible();
    await user.click(screen.getByRole('button', { name: /copy results/i }));
    expect(writeText).toHaveBeenCalledWith(
      expect.stringMatching(/^🧭 Country Guesser Daily .*\n🌍 Score: 0\/5\n[⚫🟢]+$/),
    );
    await user.click(screen.getByRole('button', { name: /main menu/i }));
    await waitFor(() => {
      expect(showModalMock).toHaveBeenCalledTimes(2);
    });
  });
});
