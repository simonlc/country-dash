import { m } from '@/paraglide/messages.js';

const geographyLabelResolvers: Record<string, () => string> = {
  Africa: () => `${m.geo_label_africa()}`,
  Antarctica: () => `${m.geo_label_antarctica()}`,
  Asia: () => `${m.geo_label_asia()}`,
  Europe: () => `${m.geo_label_europe()}`,
  'North America': () => `${m.geo_label_north_america()}`,
  Oceania: () => `${m.geo_label_oceania()}`,
  'Seven seas (open ocean)': () => `${m.geo_label_seven_seas()}`,
  'South America': () => `${m.geo_label_south_america()}`,
  'Australia and New Zealand': () => `${m.geo_label_australia_new_zealand()}`,
  Caribbean: () => `${m.geo_label_caribbean()}`,
  'Central America': () => `${m.geo_label_central_america()}`,
  'Central Asia': () => `${m.geo_label_central_asia()}`,
  'Eastern Africa': () => `${m.geo_label_eastern_africa()}`,
  'Eastern Asia': () => `${m.geo_label_eastern_asia()}`,
  'Eastern Europe': () => `${m.geo_label_eastern_europe()}`,
  Melanesia: () => `${m.geo_label_melanesia()}`,
  Micronesia: () => `${m.geo_label_micronesia()}`,
  'Middle Africa': () => `${m.geo_label_middle_africa()}`,
  'Northern Africa': () => `${m.geo_label_northern_africa()}`,
  'Northern America': () => `${m.geo_label_northern_america()}`,
  'Northern Europe': () => `${m.geo_label_northern_europe()}`,
  Polynesia: () => `${m.geo_label_polynesia()}`,
  'South-Eastern Asia': () => `${m.geo_label_south_eastern_asia()}`,
  'Southern Africa': () => `${m.geo_label_southern_africa()}`,
  'Southern Asia': () => `${m.geo_label_southern_asia()}`,
  'Southern Europe': () => `${m.geo_label_southern_europe()}`,
  'Western Africa': () => `${m.geo_label_western_africa()}`,
  'Western Asia': () => `${m.geo_label_western_asia()}`,
  'Western Europe': () => `${m.geo_label_western_europe()}`,
};

export function getLocalizedGeographyLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const resolver = geographyLabelResolvers[value];
  return resolver ? resolver() : value;
}
