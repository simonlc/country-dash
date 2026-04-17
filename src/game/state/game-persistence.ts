import type {
  AnswerResult,
  CountrySizeFilter,
  Difficulty,
  GameMode,
  GameState,
  GameStatus,
  RegionFilter,
  SessionKind,
} from '@/types/game';

export const gameSessionStorageKey = 'country-dash:game-session:v1';

type JsonPrimitive = boolean | null | number | string;
type JsonValue = JsonObject | JsonPrimitive | JsonValue[];

interface JsonObject {
  [key: string]: JsonValue;
}

export interface PersistedGameSessionV1 {
  schemaVersion: 1;
  state: GameState;
}

interface BrowserStorage {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
}

function getBrowserStorage(): BrowserStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storage = window.localStorage as Partial<BrowserStorage>;
  if (
    typeof storage.getItem !== 'function' ||
    typeof storage.setItem !== 'function' ||
    typeof storage.removeItem !== 'function'
  ) {
    return null;
  }

  return storage as BrowserStorage;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNumber(value: JsonValue | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isString(value: JsonValue | undefined): value is string {
  return typeof value === 'string';
}

function isNullableNumber(value: JsonValue | undefined): value is number | null {
  return value === null || isNumber(value);
}

function isNullableString(value: JsonValue | undefined): value is string | null {
  return value === null || isString(value);
}

function isStringArray(value: JsonValue | undefined): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isDifficultyValue(value: JsonValue | undefined): value is Difficulty {
  return (
    value === 'easy' ||
    value === 'medium' ||
    value === 'hard' ||
    value === 'veryHard'
  );
}

function isCountrySizeFilterValue(
  value: JsonValue | undefined,
): value is CountrySizeFilter {
  return value === 'large' || value === 'mixed' || value === 'small';
}

function isGameModeValue(value: JsonValue | undefined): value is GameMode {
  return (
    value === 'classic' ||
    value === 'threeLives' ||
    value === 'capitals' ||
    value === 'streak'
  );
}

function isSessionKindValue(value: JsonValue | undefined): value is SessionKind {
  return value === 'random' || value === 'daily';
}

function isGameStatusValue(value: JsonValue | undefined): value is GameStatus {
  return (
    value === 'intro' ||
    value === 'playing' ||
    value === 'reviewing' ||
    value === 'gameOver'
  );
}

function isAnswerResultValue(value: JsonValue | undefined): value is AnswerResult {
  return value === 'correct' || value === 'incorrect';
}

function isRegionFilterValue(
  value: JsonValue | undefined,
): value is RegionFilter {
  return (
    value === 'africa' ||
    value === 'asia' ||
    value === 'europe' ||
    value === 'northAmerica' ||
    value === 'southAmerica' ||
    value === 'oceania' ||
    value === 'microstates' ||
    value === 'islandNations' ||
    value === 'caribbean' ||
    value === 'middleEast'
  );
}

function isNullableRegionFilterValue(
  value: JsonValue | undefined,
): value is RegionFilter | null {
  return value === null || isRegionFilterValue(value);
}

function isSessionConfigValue(value: JsonValue | undefined) {
  if (!isJsonObject(value)) {
    return false;
  }

  return (
    isSessionKindValue(value.kind) &&
    isGameModeValue(value.mode) &&
    isDifficultyValue(value.selectedDifficulty) &&
    isNullableRegionFilterValue(value.regionFilter) &&
    isCountrySizeFilterValue(value.countrySizeFilter) &&
    isString(value.seed) &&
    isNullableString(value.dateKey) &&
    isNullableNumber(value.maxRounds) &&
    isNullableNumber(value.startingLives)
  );
}

function isDifficultyBucketsValue(
  value: JsonValue | undefined,
): value is Record<Difficulty, string[]> {
  if (!isJsonObject(value)) {
    return false;
  }

  return (
    isStringArray(value.easy) &&
    isStringArray(value.medium) &&
    isStringArray(value.hard) &&
    isStringArray(value.veryHard)
  );
}

function isSessionPlanValue(value: JsonValue | undefined) {
  if (!isJsonObject(value)) {
    return false;
  }

  return (
    isStringArray(value.allCountryIds) &&
    isDifficultyBucketsValue(value.countryIdsByDifficulty) &&
    isNumber(value.totalRounds)
  );
}

function isRoundRecordValue(value: JsonValue | undefined) {
  if (!isJsonObject(value)) {
    return false;
  }

  return (
    isString(value.countryId) &&
    isString(value.countryName) &&
    isNullableString(value.capitalName) &&
    isNullableString(value.continent) &&
    isNullableString(value.region) &&
    isNullableString(value.subregion) &&
    isString(value.playerGuess) &&
    isAnswerResultValue(value.answerResult) &&
    isNumber(value.roundElapsedMs) &&
    isNumber(value.scoreDelta) &&
    isDifficultyValue(value.effectiveDifficulty)
  );
}

function isRoundRecordArrayValue(
  value: JsonValue | undefined,
): boolean {
  return Array.isArray(value) && value.every((round) => isRoundRecordValue(round));
}

function isDailyResultValue(
  value: JsonValue | undefined,
): boolean {
  if (!isJsonObject(value)) {
    return false;
  }

  return (
    isString(value.date) &&
    isString(value.seed) &&
    isString(value.completedAt) &&
    isNumber(value.correctCount) &&
    isNumber(value.totalCount) &&
    isRoundRecordArrayValue(value.rounds)
  );
}

function isNullableDailyResultValue(
  value: JsonValue | undefined,
): boolean {
  return value === null || isDailyResultValue(value);
}

function isGameStateValue(
  value: JsonValue | undefined,
): value is JsonObject & GameState {
  if (!isJsonObject(value)) {
    return false;
  }

  return (
    isGameStatusValue(value.status) &&
    (value.sessionConfig === null || isSessionConfigValue(value.sessionConfig)) &&
    (value.sessionPlan === null || isSessionPlanValue(value.sessionPlan)) &&
    isDifficultyValue(value.selectedDifficulty) &&
    isDifficultyValue(value.effectiveDifficulty) &&
    isGameModeValue(value.mode) &&
    isNullableRegionFilterValue(value.regionFilter) &&
    isCountrySizeFilterValue(value.countrySizeFilter) &&
    isNullableString(value.currentCountryId) &&
    isNumber(value.roundIndex) &&
    isNumber(value.correct) &&
    isNumber(value.incorrect) &&
    isNumber(value.streak) &&
    isNumber(value.bestStreak) &&
    isNumber(value.missStreak) &&
    isNumber(value.score) &&
    isNullableNumber(value.livesRemaining) &&
    isRoundRecordArrayValue(value.rounds) &&
    isStringArray(value.usedCountryIds) &&
    isStringArray(value.missedCountryIds) &&
    isStringArray(value.reviewQueue) &&
    isNullableNumber(value.currentRoundStartedAt) &&
    isNumber(value.currentRoundElapsedMs) &&
    isNumber(value.totalElapsedMs) &&
    (value.lastRound === null || isRoundRecordValue(value.lastRound)) &&
    isNullableDailyResultValue(value.dailyResult)
  );
}

function migratePersistedSession(
  value: JsonValue | undefined,
): PersistedGameSessionV1 | null {
  if (!isJsonObject(value)) {
    return null;
  }

  if (value.schemaVersion === 1 && isGameStateValue(value.state)) {
    return {
      schemaVersion: 1,
      state: value.state,
    };
  }

  if (value.schemaVersion === undefined && isGameStateValue(value)) {
    return {
      schemaVersion: 1,
      state: value,
    };
  }

  return null;
}

function readPersistedSession(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as JsonValue;
    return migratePersistedSession(parsed);
  } catch {
    return null;
  }
}

export const gameSessionStorage = {
  getItem(key: string, initialValue: GameState) {
    const storage = getBrowserStorage();
    if (!storage) {
      return initialValue;
    }

    const persisted = readPersistedSession(storage.getItem(key));
    if (!persisted) {
      storage.removeItem(key);
      return initialValue;
    }

    return persisted.state;
  },
  removeItem(key: string) {
    const storage = getBrowserStorage();
    if (!storage) {
      return;
    }

    storage.removeItem(key);
  },
  setItem(key: string, value: GameState) {
    const storage = getBrowserStorage();
    if (!storage) {
      return;
    }

    const payload: PersistedGameSessionV1 = {
      schemaVersion: 1,
      state: value,
    };
    storage.setItem(key, JSON.stringify(payload));
  },
};
