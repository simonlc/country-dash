import { geoCentroid } from 'd3';
import { weights, weightedShuffle } from '@/weights';
import type {
  CountryFeature,
  Difficulty,
  FeatureCollectionLike,
  GameState,
} from '@/features/game/types';

export const difficulties: Record<Difficulty, number> = {
  easy: 0.8,
  medium: 0.5,
  hard: 0.3,
  veryHard: 0,
};

export function buildCountryPool(world: FeatureCollectionLike): CountryFeature[] {
  const countriesByIso = new Map(
    world.features.map((feature) => [feature.properties.isocode, feature] as const),
  );

  return weightedShuffle(Object.entries(weights))
    .map(([countryCode]) => countriesByIso.get(countryCode))
    .filter((feature): feature is CountryFeature => feature !== undefined);
}

export function buildCountriesByDifficulty(countries: CountryFeature[]) {
  return {
    easy: countries.filter(
      (country) =>
        (weights[country.properties.isocode as keyof typeof weights] ?? 0) >=
        difficulties.easy,
    ),
    medium: countries.filter(
      (country) =>
        (weights[country.properties.isocode as keyof typeof weights] ?? 0) >=
        difficulties.medium,
    ),
    hard: countries.filter(
      (country) =>
        (weights[country.properties.isocode as keyof typeof weights] ?? 0) >=
        difficulties.hard,
    ),
    veryHard: [...countries],
  } satisfies Record<Difficulty, CountryFeature[]>;
}

export function getInitialRotation(country: CountryFeature): [number, number] {
  const [longitude, latitude] = geoCentroid(country);
  return [-longitude, -latitude];
}

export function isCorrectGuess(input: string, answer: string) {
  return input.trim().toLowerCase() === answer.trim().toLowerCase();
}

export function nextRoundIndex(current: number, total: number) {
  return current + 1 < total ? current + 1 : null;
}

export function createInitialGameState(
  difficulty: Difficulty = 'hard',
): GameState {
  return {
    difficulty,
    roundIndex: 0,
    correct: 0,
    incorrect: 0,
    streak: 0,
    status: 'intro',
    answerResult: null,
    elapsedMs: 0,
  };
}
