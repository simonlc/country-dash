import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type {
  GeometryCollection as TopologyGeometryCollection,
  Topology,
} from 'topojson-specification';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'veryHard';
export type GameStatus = 'intro' | 'playing' | 'answered' | 'gameOver';
export type AnswerResult = 'correct' | 'incorrect';
export type GlobeRenderer = 'svg' | 'webgl';

export interface CountryProperties {
  nameEn: string;
  name?: string;
  abbr?: string | null;
  formalName?: string | null;
  nameAlt?: string | null;
  isocode: string;
  isocode3: string;
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

export interface GameState {
  difficulty: Difficulty;
  roundIndex: number;
  correct: number;
  incorrect: number;
  streak: number;
  status: GameStatus;
  answerResult: AnswerResult | null;
  elapsedMs: number;
}

export interface WorldData {
  world: FeatureCollectionLike;
}
