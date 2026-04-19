import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type {
  GeometryCollection as TopologyGeometryCollection,
  Topology,
} from 'topojson-specification';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'veryHard';
export type CountrySizeFilter = 'large' | 'mixed' | 'small' | 'all';
export type GameMode = 'classic' | 'threeLives' | 'capitals' | 'streak';
export type SessionKind = 'random' | 'daily';
export type GameStatus = 'intro' | 'playing' | 'reviewing' | 'gameOver';
export type AnswerResult = 'correct' | 'incorrect';
export type CountryTag =
  | 'microstate'
  | 'islandNation'
  | 'caribbean'
  | 'middleEast';
export type RegionFilter =
  | 'africa'
  | 'asia'
  | 'europe'
  | 'northAmerica'
  | 'southAmerica'
  | 'oceania'
  | 'microstates'
  | 'islandNations'
  | 'caribbean'
  | 'middleEast';

export interface CountryProperties {
  nameEn: string;
  name?: string;
  localizedNames?: Record<string, string>;
  abbr?: string | null;
  formalName?: string | null;
  nameAlt?: string | null;
  isocode: string;
  isocode3: string;
  capitalName?: string | null;
  capitalAliases?: string[];
  capitalLongitude?: number | null;
  capitalLatitude?: number | null;
  continent?: string | null;
  region?: string | null;
  subregion?: string | null;
  tags?: CountryTag[];
}

export type CountryFeature = Feature<Geometry, CountryProperties> & {
  id: string;
};

export interface FeatureCollectionLike
  extends FeatureCollection<Geometry, CountryProperties> {
  features: CountryFeature[];
}

export type WorldTopologyObject = Topology<{
  [key: string]: TopologyGeometryCollection<CountryProperties>;
}>;

export type WorldTopologyGeometryCollection =
  TopologyGeometryCollection<CountryProperties>;

export interface SessionConfig {
  kind: SessionKind;
  mode: GameMode;
  selectedDifficulty: Difficulty;
  regionFilter: RegionFilter | null;
  countrySizeFilter: CountrySizeFilter;
  seed: string;
  dateKey: string | null;
  maxRounds: number | null;
  startingLives: number | null;
}

export interface SessionPlan {
  allCountryIds: string[];
  countryIdsByDifficulty: Record<Difficulty, string[]>;
  totalRounds: number;
}

export interface RoundRecord {
  countryId: string;
  countryName: string;
  capitalName: string | null;
  continent: string | null;
  region: string | null;
  subregion: string | null;
  playerGuess: string;
  answerResult: AnswerResult;
  roundElapsedMs: number;
  scoreDelta: number;
  effectiveDifficulty: Difficulty;
}

export interface DailyChallengeResult {
  date: string;
  seed: string;
  completedAt: string;
  correctCount: number;
  totalCount: number;
  rounds: RoundRecord[];
}

export interface GameState {
  status: GameStatus;
  sessionConfig: SessionConfig | null;
  sessionPlan: SessionPlan | null;
  selectedDifficulty: Difficulty;
  effectiveDifficulty: Difficulty;
  mode: GameMode;
  regionFilter: RegionFilter | null;
  countrySizeFilter: CountrySizeFilter;
  currentCountryId: string | null;
  roundIndex: number;
  correct: number;
  incorrect: number;
  streak: number;
  bestStreak: number;
  missStreak: number;
  score: number;
  livesRemaining: number | null;
  rounds: RoundRecord[];
  usedCountryIds: string[];
  missedCountryIds: string[];
  reviewQueue: string[];
  currentRoundStartedAt: number | null;
  currentRoundElapsedMs: number;
  totalElapsedMs: number;
  lastRound: RoundRecord | null;
  dailyResult: DailyChallengeResult | null;
}

export interface WorldData {
  countryNameLanguages?: string[];
  world: FeatureCollectionLike;
}
