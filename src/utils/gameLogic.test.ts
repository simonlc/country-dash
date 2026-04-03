import { describe, expect, it } from 'vitest';
import {
  buildCountriesBySize,
  buildCountrySizePool,
  buildCountriesByDifficulty,
  buildDailyShareText,
  buildRegionCountryPool,
  buildSessionPlan,
  calculateRoundScore,
  createInitialGameState,
  createSeededRng,
  createSessionConfig,
  deriveDailyResult,
  formatDailyStorageKey,
  gameReducer,
  getRandomRunCountryCount,
  getTodayDateKey,
  isCorrectGuess,
  nextRoundIndex,
  normalizeGuess,
} from '@/utils/gameLogic';
import type { CountryFeature, FeatureCollectionLike } from '@/types/game';

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

const countries = [
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
] satisfies CountryFeature[];

const world: FeatureCollectionLike = {
  type: 'FeatureCollection',
  features: countries,
};
const fallbackCountry = countries[0]!;

describe('gameLogic', () => {
  it('matches guesses case-insensitively and normalizes accents', () => {
    expect(
      isCorrectGuess(
        'canada',
        createCountry({
          id: 'CA',
          name: 'Canada',
          isocode: 'CA',
          isocode3: 'CAN',
          continent: 'North America',
          subregion: 'Northern America',
        }),
        'classic',
      ),
    ).toBe(true);
    expect(normalizeGuess('Côte d’Ivoire')).toBe('cote d ivoire');
  });

  it('returns null when the game is over', () => {
    expect(nextRoundIndex(4, 5)).toBe(null);
  });

  it('creates a typed default state', () => {
    expect(createInitialGameState()).toEqual({
      bestStreak: 0,
      correct: 0,
      countrySizeFilter: 'mixed',
      currentCountryId: null,
      currentRoundElapsedMs: 0,
      currentRoundStartedAt: null,
      dailyResult: null,
      effectiveDifficulty: 'hard',
      hintsUsedThisRound: 0,
      incorrect: 0,
      lastRound: null,
      livesRemaining: null,
      missStreak: 0,
      mode: 'classic',
      regionFilter: null,
      reviewQueue: [],
      roundIndex: 0,
      rounds: [],
      score: 0,
      selectedDifficulty: 'hard',
      sessionConfig: null,
      sessionPlan: null,
      status: 'intro',
      streak: 0,
      totalElapsedMs: 0,
      missedCountryIds: [],
      usedCountryIds: [],
    });
  });

  it('builds deterministic session plans from a seed', () => {
    const config = createSessionConfig({
      difficulty: 'medium',
      kind: 'daily',
      mode: 'classic',
      seed: '2026-03-31',
      dateKey: '2026-03-31',
    });
    const firstPlan = buildSessionPlan(world, config);
    const secondPlan = buildSessionPlan(world, config);

    expect(firstPlan).toEqual(secondPlan);
    expect(firstPlan.totalRounds).toBe(5);
  });

  it('uses a fixed random-run group size when no category pool is selected', () => {
    const config = createSessionConfig({
      difficulty: 'easy',
      kind: 'random',
      mode: 'classic',
      countrySizeFilter: 'small',
      seed: 'group-seed',
    });
    const plan = buildSessionPlan(world, config);

    expect(plan.totalRounds).toBe(getRandomRunCountryCount(world.features.length, 'small'));
  });

  it('filters countries by region tags', () => {
    expect(buildRegionCountryPool(countries, 'microstates').map((country) => country.id)).toEqual(
      ['NR'],
    );
    expect(buildRegionCountryPool(countries, 'asia').map((country) => country.id)).toEqual([
      'JP',
      'QA',
    ]);
  });

  it('builds non-overlapping difficulty bands', () => {
    const bands = buildCountriesByDifficulty(countries);

    expect(bands.easy.map((country) => country.id)).toEqual(['CA', 'JP']);
    expect(bands.medium.map((country) => country.id)).toEqual(['QA']);
    expect(bands.hard.map((country) => country.id)).toEqual(['BZ']);
    expect(bands.veryHard.map((country) => country.id)).toEqual(['NR']);
  });

  it('builds country-size bands and filters them', () => {
    const sizeBands = buildCountriesBySize(countries);

    expect(sizeBands.large.map((country) => country.id)).toEqual(['CA', 'JP']);
    expect(sizeBands.mixed.map((country) => country.id)).toEqual(['QA', 'BZ']);
    expect(sizeBands.small.map((country) => country.id)).toEqual(['NR']);
    expect(buildCountrySizePool(countries, 'small').map((country) => country.id)).toEqual([
      'NR',
    ]);
  });

  it('never awards a negative score', () => {
    expect(
      calculateRoundScore({
        answerResult: 'incorrect',
        hintsUsed: 10,
        roundElapsedMs: 90_000,
        streak: 0,
      }),
    ).toBe(0);
  });

  it('locks in a daily result after the final daily review', () => {
    const config = createSessionConfig({
      difficulty: 'medium',
      kind: 'daily',
      mode: 'classic',
      seed: '2026-03-31',
      dateKey: '2026-03-31',
    });
    const plan = buildSessionPlan(world, config);
    let state = gameReducer(createInitialGameState(), {
      type: 'START_SESSION',
      config,
      plan,
      startedAt: 0,
    });

    for (let round = 0; round < plan.totalRounds; round += 1) {
      const currentCountry = countries.find((country) => country.id === state.currentCountryId);

      expect(currentCountry).toBeDefined();

      state = gameReducer(state, {
        type: 'SUBMIT_GUESS',
        country: currentCountry ?? fallbackCountry,
        guess: currentCountry?.properties.nameEn ?? '',
        submittedAt: round * 1000 + 500,
      });
      state = gameReducer(state, {
        type: 'ADVANCE_ROUND',
        startedAt: round * 1000 + 750,
      });
    }

    expect(state.status).toBe('gameOver');
    expect(state.dailyResult?.correctCount).toBe(5);
    expect(state.dailyResult?.date).toBe('2026-03-31');
    expect(deriveDailyResult(state)?.totalCount).toBe(5);
  });

  it('creates stable seeds and storage keys for daily runs', () => {
    expect(getTodayDateKey(new Date('2026-03-31T12:00:00-04:00'))).toBe('2026-03-31');
    expect(formatDailyStorageKey('2026-03-31')).toBe('country-guesser-daily:2026-03-31');
    const rng = createSeededRng('seed');

    expect(rng()).toBeCloseTo(createSeededRng('seed')(), 10);
  });

  it('builds a custom daily share string', () => {
    const shareText = buildDailyShareText({
      completedAt: '2026-03-31T12:00:00.000Z',
      correctCount: 3,
      date: '2026-03-31',
      rounds: [
        {
          answerResult: 'correct',
          capitalName: null,
          continent: 'Asia',
          countryId: 'JP',
          countryName: 'Japan',
          effectiveDifficulty: 'medium',
          hintsUsed: 0,
          playerGuess: 'Japan',
          region: 'Asia',
          roundElapsedMs: 1000,
          scoreDelta: 100,
          subregion: 'Eastern Asia',
        },
        {
          answerResult: 'incorrect',
          capitalName: null,
          continent: 'Asia',
          countryId: 'QA',
          countryName: 'Qatar',
          effectiveDifficulty: 'medium',
          hintsUsed: 0,
          playerGuess: 'Qater',
          region: 'Asia',
          roundElapsedMs: 1000,
          scoreDelta: 0,
          subregion: 'Western Asia',
        },
        {
          answerResult: 'correct',
          capitalName: null,
          continent: 'North America',
          countryId: 'BZ',
          countryName: 'Belize',
          effectiveDifficulty: 'hard',
          hintsUsed: 0,
          playerGuess: 'Belize',
          region: 'North America',
          roundElapsedMs: 1000,
          scoreDelta: 100,
          subregion: 'Central America',
        },
      ],
      seed: '2026-03-31',
      totalCount: 5,
    });

    expect(shareText).toBe(
      '🧭 Country Dash Daily 2026-03-31\n🌍 Score: 3/5\n🟢⚫🟢',
    );
  });
});
