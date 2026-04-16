import { m } from '@/paraglide/messages.js';
import type {
  CountrySizeFilter,
  GameMode,
  RegionFilter,
  SessionKind,
} from '@/types/game';

export const regionFilters: RegionFilter[] = [
  'africa',
  'asia',
  'europe',
  'northAmerica',
  'southAmerica',
  'oceania',
  'microstates',
  'islandNations',
  'caribbean',
  'middleEast',
];

export const countrySizeFilters: CountrySizeFilter[] = [
  'large',
  'mixed',
  'small',
];

export function getModeLabel(mode: GameMode) {
  switch (mode) {
    case 'classic':
      return `${m.mode_classic()}`;
    case 'threeLives':
      return `${m.mode_three_lives()}`;
    case 'capitals':
      return `${m.mode_capitals()}`;
    case 'streak':
      return `${m.mode_streak()}`;
  }
}

export function getSessionTypeLabel(kind: SessionKind | null) {
  if (!kind) {
    return `${m.session_type_menu()}`;
  }

  return kind === 'daily'
    ? `${m.session_type_daily()}`
    : `${m.session_type_random()}`;
}

export function getRegionLabel(region: RegionFilter) {
  switch (region) {
    case 'africa':
      return `${m.region_africa()}`;
    case 'asia':
      return `${m.region_asia()}`;
    case 'europe':
      return `${m.region_europe()}`;
    case 'northAmerica':
      return `${m.region_north_america()}`;
    case 'southAmerica':
      return `${m.region_south_america()}`;
    case 'oceania':
      return `${m.region_oceania()}`;
    case 'microstates':
      return `${m.region_micro_countries()}`;
    case 'islandNations':
      return `${m.region_island_nations()}`;
    case 'caribbean':
      return `${m.region_caribbean()}`;
    case 'middleEast':
      return `${m.region_middle_east()}`;
  }
}

export function getCountrySizeLabel(size: CountrySizeFilter) {
  switch (size) {
    case 'large':
      return `${m.pool_long_run()}`;
    case 'mixed':
      return `${m.pool_standard_run()}`;
    case 'small':
      return `${m.pool_quick_run()}`;
  }
}
