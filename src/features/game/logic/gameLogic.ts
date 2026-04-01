import { geoArea, geoCentroid } from 'd3';
import { weights, weightedShuffle } from '@/weights';
import type {
  AnswerResult,
  CountrySizeFilter,
  CountryFeature,
  DailyChallengeResult,
  Difficulty,
  GameMode,
  GameState,
  RegionFilter,
  RoundRecord,
  SessionConfig,
  SessionKind,
  SessionPlan,
} from '@/features/game/types';

export const difficulties: Record<Difficulty, number> = {
  easy: 0.8,
  medium: 0.5,
  hard: 0.3,
  veryHard: 0,
};

const difficultyOrder: Difficulty[] = ['easy', 'medium', 'hard', 'veryHard'];
const dailyRoundCount = 5;
const speedrunRoundCount = 10;
const threeLivesCount = 3;
const normalMode: GameMode = 'classic';
const defaultDifficulty: Difficulty = 'hard';

export const regionLabels: Record<RegionFilter, string> = {
  africa: 'Africa',
  asia: 'Asia',
  europe: 'Europe',
  northAmerica: 'North America',
  southAmerica: 'South America',
  oceania: 'Oceania',
  microstates: 'Micro countries',
  islandNations: 'Island nations',
  caribbean: 'Caribbean',
  middleEast: 'Middle East',
};

export const countrySizeLabels: Record<CountrySizeFilter, string> = {
  large: 'Large',
  mixed: 'Mixed',
  small: 'Small',
};

export function formatDailyStorageKey(dateKey: string) {
  return `country-guesser-daily:${dateKey}`;
}

export function createRandomSeed() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getTodayDateKey(now = new Date()) {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hashSeed(seed: string) {
  let hash = 2166136261;

  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createSeededRng(seed: string) {
  let state = hashSeed(seed) || 1;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildCountryPool(
  world: { features: CountryFeature[] },
  random: () => number = Math.random,
): CountryFeature[] {
  const countriesByIso = new Map(
    world.features.map((feature) => [feature.properties.isocode, feature] as const),
  );

  return weightedShuffle(Object.entries(weights), random)
    .map(([countryCode]) => countriesByIso.get(countryCode))
    .filter((feature): feature is CountryFeature => feature !== undefined);
}

function getWeight(country: CountryFeature) {
  return weights[country.properties.isocode as keyof typeof weights] ?? 0;
}

function isCountryInDifficultyBand(country: CountryFeature, difficulty: Difficulty) {
  const weight = getWeight(country);

  if (difficulty === 'easy') {
    return weight >= difficulties.easy;
  }
  if (difficulty === 'medium') {
    return weight >= difficulties.medium && weight < difficulties.easy;
  }
  if (difficulty === 'hard') {
    return weight >= difficulties.hard && weight < difficulties.medium;
  }
  return weight < difficulties.hard;
}

export function buildCountriesByDifficulty(countries: CountryFeature[]) {
  return {
    easy: countries.filter((country) => isCountryInDifficultyBand(country, 'easy')),
    medium: countries.filter((country) => isCountryInDifficultyBand(country, 'medium')),
    hard: countries.filter((country) => isCountryInDifficultyBand(country, 'hard')),
    veryHard: countries.filter((country) => isCountryInDifficultyBand(country, 'veryHard')),
  } satisfies Record<Difficulty, CountryFeature[]>;
}

export function buildRegionCountryPool(
  countries: CountryFeature[],
  regionFilter: RegionFilter | null,
) {
  if (!regionFilter) {
    return countries;
  }

  return countries.filter((country) => {
    const { continent, tags } = country.properties;

    switch (regionFilter) {
      case 'africa':
        return continent === 'Africa';
      case 'asia':
        return continent === 'Asia';
      case 'europe':
        return continent === 'Europe';
      case 'northAmerica':
        return continent === 'North America';
      case 'southAmerica':
        return continent === 'South America';
      case 'oceania':
        return continent === 'Oceania';
      case 'microstates':
        return tags?.includes('microstate') ?? false;
      case 'islandNations':
        return tags?.includes('islandNation') ?? false;
      case 'caribbean':
        return tags?.includes('caribbean') ?? false;
      case 'middleEast':
        return tags?.includes('middleEast') ?? false;
    }
  });
}

export function buildCountriesBySize(countries: CountryFeature[]) {
  if (countries.length === 0) {
    return {
      large: [],
      mixed: [],
      small: [],
    } satisfies Record<CountrySizeFilter, CountryFeature[]>;
  }

  const rankedCountries = [...countries]
    .map((country) => ({
      area: geoArea(country),
      country,
    }))
    .sort((left, right) => right.area - left.area)
    .map((entry) => entry.country);
  const bucketSize = Math.ceil(rankedCountries.length / 3);

  return {
    large: rankedCountries.slice(0, bucketSize),
    mixed: rankedCountries.slice(bucketSize, bucketSize * 2),
    small: rankedCountries.slice(bucketSize * 2),
  } satisfies Record<CountrySizeFilter, CountryFeature[]>;
}

export function buildCountrySizePool(
  countries: CountryFeature[],
  countrySizeFilter: CountrySizeFilter,
) {
  if (countrySizeFilter === 'mixed') {
    return countries;
  }

  const countriesBySize = buildCountriesBySize(countries);
  return countriesBySize[countrySizeFilter];
}

export function createSessionConfig(args: {
  difficulty?: Difficulty;
  kind?: SessionKind;
  mode: GameMode;
  regionFilter?: RegionFilter | null;
  countrySizeFilter?: CountrySizeFilter;
  seed: string;
  dateKey?: string | null;
}): SessionConfig {
  const kind = args.kind ?? 'random';
  const selectedDifficulty = args.difficulty ?? defaultDifficulty;

  return {
    kind,
    mode: args.mode,
    selectedDifficulty,
    regionFilter: args.regionFilter ?? null,
    countrySizeFilter: args.countrySizeFilter ?? 'mixed',
    seed: args.dateKey ?? args.seed,
    dateKey: args.dateKey ?? null,
    maxRounds:
      kind === 'daily'
        ? dailyRoundCount
        : args.mode === 'speedrun'
          ? speedrunRoundCount
          : null,
    startingLives: args.mode === 'threeLives' ? threeLivesCount : null,
  };
}

export function buildSessionPlan(
  world: { features: CountryFeature[] },
  config: SessionConfig,
): SessionPlan {
  const random = createSeededRng(config.seed);
  const basePool = buildCountryPool(world, random);
  const regionPool = buildRegionCountryPool(basePool, config.regionFilter);
  const filteredPool = buildCountrySizePool(regionPool, config.countrySizeFilter);
  const countriesByDifficulty = buildCountriesByDifficulty(filteredPool);
  const totalRounds = Math.min(
    config.maxRounds ?? filteredPool.length,
    filteredPool.length,
  );

  return {
    allCountryIds: filteredPool.map((country) => country.id),
    countryIdsByDifficulty: {
      easy: countriesByDifficulty.easy.map((country) => country.id),
      medium: countriesByDifficulty.medium.map((country) => country.id),
      hard: countriesByDifficulty.hard.map((country) => country.id),
      veryHard: countriesByDifficulty.veryHard.map((country) => country.id),
    },
    totalRounds,
  };
}

function getDifficultyRank(difficulty: Difficulty) {
  return difficultyOrder.indexOf(difficulty);
}

function clampDifficultyRank(rank: number) {
  return Math.max(0, Math.min(difficultyOrder.length - 1, rank));
}

function difficultyFromRank(rank: number): Difficulty {
  return difficultyOrder[clampDifficultyRank(rank)] ?? 'veryHard';
}

export function resolveNextDifficulty(
  selectedDifficulty: Difficulty,
  streak: number,
  missStreak: number,
) {
  const baseRank = getDifficultyRank(selectedDifficulty);
  const upwardShift = streak >= 6 ? 2 : streak >= 3 ? 1 : 0;
  const downwardShift = missStreak >= 2 ? 2 : missStreak >= 1 ? 1 : 0;

  return difficultyFromRank(baseRank + upwardShift - downwardShift);
}

function getDifficultySearchOrder(difficulty: Difficulty) {
  const rank = getDifficultyRank(difficulty);
  const searchOrder = difficultyOrder
    .map((value, index) => ({
      distance: Math.abs(index - rank),
      index,
      value,
    }))
    .sort((left, right) => {
      if (left.distance !== right.distance) {
        return left.distance - right.distance;
      }
      return left.index - right.index;
    })
    .map((entry) => entry.value);

  return searchOrder;
}

function selectNextCountryId(
  plan: SessionPlan,
  usedCountryIds: string[],
  difficulty: Difficulty,
) {
  const usedIds = new Set(usedCountryIds);

  for (const band of getDifficultySearchOrder(difficulty)) {
    for (const countryId of plan.countryIdsByDifficulty[band]) {
      if (!usedIds.has(countryId)) {
        return countryId;
      }
    }
  }

  for (const countryId of plan.allCountryIds) {
    if (!usedIds.has(countryId)) {
      return countryId;
    }
  }

  return null;
}

export function getInitialRotation(country: CountryFeature): [number, number] {
  const [longitude, latitude] = geoCentroid(country);
  return [-longitude, -latitude];
}

export function normalizeGuess(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.'’()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getCountryAliases(country: CountryFeature) {
  return [
    country.properties.nameEn,
    country.properties.name,
    country.properties.abbr,
    country.properties.formalName,
    country.properties.nameAlt,
    country.properties.isocode,
    country.properties.isocode3,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeGuess(value));
}

export function isCorrectGuess(input: string, country: CountryFeature) {
  const normalizedInput = normalizeGuess(input);

  return normalizedInput.length > 0 && getCountryAliases(country).includes(normalizedInput);
}

export function calculateRoundScore(args: {
  answerResult: AnswerResult;
  roundElapsedMs: number;
  streak: number;
  hintsUsed: number;
  mode: GameMode;
}) {
  if (args.answerResult === 'incorrect') {
    return 0;
  }

  const baseScore = 100;
  const timeBonus =
    args.mode === 'speedrun'
      ? Math.max(0, 180 - Math.floor(args.roundElapsedMs / 250))
      : Math.max(0, 90 - Math.floor(args.roundElapsedMs / 500));
  const streakBonus = Math.max(0, args.streak - 1) * 15;
  const firstTryBonus = args.hintsUsed === 0 ? 25 : 0;
  const hintPenalty = args.hintsUsed * 15;

  return Math.max(0, baseScore + timeBonus + streakBonus + firstTryBonus - hintPenalty);
}

export function nextRoundIndex(current: number, total: number) {
  return current + 1 < total ? current + 1 : null;
}

function buildRoundRecord(args: {
  country: CountryFeature;
  playerGuess: string;
  answerResult: AnswerResult;
  roundElapsedMs: number;
  scoreDelta: number;
  effectiveDifficulty: Difficulty;
  hintsUsed: number;
}): RoundRecord {
  return {
    countryId: args.country.id,
    countryName: args.country.properties.nameEn,
    continent: args.country.properties.continent ?? null,
    region: args.country.properties.region ?? null,
    subregion: args.country.properties.subregion ?? null,
    playerGuess: args.playerGuess,
    answerResult: args.answerResult,
    roundElapsedMs: args.roundElapsedMs,
    scoreDelta: args.scoreDelta,
    effectiveDifficulty: args.effectiveDifficulty,
    hintsUsed: args.hintsUsed,
  };
}

function shouldEndGame(state: GameState) {
  const { sessionConfig, sessionPlan, lastRound } = state;

  if (!sessionConfig || !sessionPlan) {
    return true;
  }
  if (state.roundIndex + 1 >= sessionPlan.totalRounds) {
    return true;
  }
  if (sessionConfig.mode === 'streak' && lastRound?.answerResult === 'incorrect') {
    return true;
  }
  if (sessionConfig.mode === 'threeLives' && (state.livesRemaining ?? 0) <= 0) {
    return true;
  }

  return false;
}

export function deriveDailyResult(state: GameState) {
  const { sessionConfig } = state;

  if (!sessionConfig || sessionConfig.kind !== 'daily' || !sessionConfig.dateKey) {
    return null;
  }

  return {
    date: sessionConfig.dateKey,
    seed: sessionConfig.seed,
    completedAt: new Date().toISOString(),
    correctCount: state.correct,
    totalCount: state.rounds.length,
    rounds: state.rounds,
  };
}

function createSessionState(
  config: SessionConfig,
  plan: SessionPlan,
  startedAt: number,
): GameState {
  const effectiveDifficulty = resolveNextDifficulty(config.selectedDifficulty, 0, 0);
  const currentCountryId = selectNextCountryId(plan, [], effectiveDifficulty);

  return {
    sessionConfig: config,
    sessionPlan: plan,
    selectedDifficulty: config.selectedDifficulty,
    effectiveDifficulty,
    mode: config.mode,
    regionFilter: config.regionFilter,
    countrySizeFilter: config.countrySizeFilter,
    currentCountryId,
    roundIndex: 0,
    correct: 0,
    incorrect: 0,
    streak: 0,
    bestStreak: 0,
    missStreak: 0,
    score: 0,
    livesRemaining: config.startingLives,
    rounds: [],
    usedCountryIds: currentCountryId ? [currentCountryId] : [],
    missedCountryIds: [],
    reviewQueue: [],
    currentRoundStartedAt: currentCountryId ? startedAt : null,
    currentRoundElapsedMs: 0,
    totalElapsedMs: 0,
    hintsUsedThisRound: 0,
    lastRound: null,
    dailyResult: null,
    status: currentCountryId ? 'playing' : 'gameOver',
  };
}

export function createInitialGameState(): GameState {
  return {
    sessionConfig: null,
    sessionPlan: null,
    selectedDifficulty: defaultDifficulty,
    effectiveDifficulty: defaultDifficulty,
    mode: normalMode,
    regionFilter: null,
    countrySizeFilter: 'mixed',
    currentCountryId: null,
    roundIndex: 0,
    correct: 0,
    incorrect: 0,
    streak: 0,
    bestStreak: 0,
    missStreak: 0,
    score: 0,
    livesRemaining: null,
    rounds: [],
    usedCountryIds: [],
    missedCountryIds: [],
    reviewQueue: [],
    currentRoundStartedAt: null,
    currentRoundElapsedMs: 0,
    totalElapsedMs: 0,
    hintsUsedThisRound: 0,
    lastRound: null,
    dailyResult: null,
    status: 'intro',
  };
}

export type GameAction =
  | {
      type: 'START_SESSION';
      config: SessionConfig;
      plan: SessionPlan;
      startedAt: number;
    }
  | {
      type: 'SUBMIT_GUESS';
      country: CountryFeature;
      guess: string;
      submittedAt: number;
    }
  | {
      type: 'ADVANCE_ROUND';
      startedAt: number;
    }
  | {
      type: 'TICK_TIMER';
      now: number;
    }
  | {
      type: 'USE_HINT';
      hintType: 'refocus';
    }
  | {
      type: 'RETURN_TO_MENU';
    };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_SESSION':
      return createSessionState(action.config, action.plan, action.startedAt);
    case 'SUBMIT_GUESS': {
      if (state.status !== 'playing' || !state.sessionConfig) {
        return state;
      }

      const startedAt = state.currentRoundStartedAt ?? action.submittedAt;
      const roundElapsedMs = Math.max(
        state.currentRoundElapsedMs,
        Math.floor(action.submittedAt - startedAt),
      );
      const answerResult = isCorrectGuess(action.guess, action.country)
        ? 'correct'
        : 'incorrect';
      const nextStreak = answerResult === 'correct' ? state.streak + 1 : 0;
      const nextMissStreak = answerResult === 'incorrect' ? state.missStreak + 1 : 0;
      const scoreDelta = calculateRoundScore({
        answerResult,
        roundElapsedMs,
        streak: nextStreak,
        hintsUsed: state.hintsUsedThisRound,
        mode: state.sessionConfig.mode,
      });
      const roundRecord = buildRoundRecord({
        country: action.country,
        playerGuess: action.guess,
        answerResult,
        roundElapsedMs,
        scoreDelta,
        effectiveDifficulty: state.effectiveDifficulty,
        hintsUsed: state.hintsUsedThisRound,
      });

      return {
        ...state,
        status: 'reviewing',
        correct: state.correct + (answerResult === 'correct' ? 1 : 0),
        incorrect: state.incorrect + (answerResult === 'incorrect' ? 1 : 0),
        streak: nextStreak,
        bestStreak: Math.max(state.bestStreak, nextStreak),
        missStreak: nextMissStreak,
        score: state.score + scoreDelta,
        livesRemaining:
          state.sessionConfig.mode === 'threeLives'
            ? Math.max(
                0,
                (state.livesRemaining ?? state.sessionConfig.startingLives ?? 0) -
                  (answerResult === 'incorrect' ? 1 : 0),
              )
            : state.livesRemaining,
        rounds: [...state.rounds, roundRecord],
        missedCountryIds:
          answerResult === 'incorrect'
            ? [...state.missedCountryIds, action.country.id]
            : state.missedCountryIds,
        reviewQueue:
          answerResult === 'incorrect'
            ? [...state.reviewQueue, action.country.id]
            : state.reviewQueue,
        currentRoundStartedAt: null,
        currentRoundElapsedMs: roundElapsedMs,
        totalElapsedMs: state.totalElapsedMs + roundElapsedMs,
        hintsUsedThisRound: 0,
        lastRound: roundRecord,
      };
    }
    case 'ADVANCE_ROUND': {
      if (!state.sessionPlan || !state.sessionConfig || state.status !== 'reviewing') {
        return state;
      }

      if (shouldEndGame(state)) {
        return {
          ...state,
          status: 'gameOver',
          dailyResult: deriveDailyResult(state),
        };
      }

      const nextRoundIndex = state.roundIndex + 1;
      const effectiveDifficulty = resolveNextDifficulty(
        state.selectedDifficulty,
        state.streak,
        state.missStreak,
      );
      const nextCountryId = selectNextCountryId(
        state.sessionPlan,
        state.usedCountryIds,
        effectiveDifficulty,
      );

      if (!nextCountryId) {
        return {
          ...state,
          status: 'gameOver',
          dailyResult: deriveDailyResult(state),
        };
      }

      return {
        ...state,
        status: 'playing',
        effectiveDifficulty,
        currentCountryId: nextCountryId,
        roundIndex: nextRoundIndex,
        usedCountryIds: [...state.usedCountryIds, nextCountryId],
        currentRoundStartedAt: action.startedAt,
        currentRoundElapsedMs: 0,
        hintsUsedThisRound: 0,
        lastRound: state.lastRound,
      };
    }
    case 'TICK_TIMER': {
      if (state.status !== 'playing' || state.currentRoundStartedAt === null) {
        return state;
      }

      return {
        ...state,
        currentRoundElapsedMs: Math.max(
          0,
          Math.floor(action.now - state.currentRoundStartedAt),
        ),
      };
    }
    case 'USE_HINT':
      return {
        ...state,
        hintsUsedThisRound: state.hintsUsedThisRound + 1,
      };
    case 'RETURN_TO_MENU':
      return createInitialGameState();
  }
}

export function formatElapsed(elapsedMs: number) {
  const hours = Math.floor(elapsedMs / 3_600_000);
  const minutes = Math.floor((elapsedMs % 3_600_000) / 60_000);
  const seconds = Math.floor((elapsedMs % 60_000) / 1_000);
  const milliseconds = elapsedMs % 1_000;

  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

function getDailyEmoji(answerResult: AnswerResult) {
  return answerResult === 'correct' ? '🟢' : '⚫';
}

export function buildDailyShareText(result: DailyChallengeResult) {
  const emojiLine = result.rounds
    .map((round) => getDailyEmoji(round.answerResult))
    .join('');

  return [
    `🧭 Country Guesser Daily ${result.date}`,
    `🌍 Score: ${result.correctCount}/${result.totalCount}`,
    emojiLine,
  ].join('\n');
}
