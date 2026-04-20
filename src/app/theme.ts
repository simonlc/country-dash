import { designTokens } from '@/app/designSystem';

export type AppThemeId =
  | 'daybreak'
  | 'midnight'
  | 'ember'
  | 'atlas'
  | 'cipher'
  | 'glacier';

export interface GlobePalette {
  oceanFill: string;
  oceanDepth: string;
  oceanHighlight: string;
  oceanHighlightOpacity: number;
  countryElevation: number;
  graticule: string;
  countryFill: string;
  countryStroke: string;
  countryDebossDark: string;
  countryDebossLight: string;
  countryDebossWidth: number;
  countryDebossOffset: number;
  countryDebossStrength: number;
  countryShadowColor: string;
  countryShadowBlur: number;
  countryShadowOffsetX: number;
  countryShadowOffsetY: number;
  selectedFill: string;
  hazeOuter: string;
  hazeInner: string;
  nightShade: string;
  smallCountryCircle: string;
  gridColor: string;
  gridStrength: number;
  noiseStrength: number;
  scanlineDensity: number;
  scanlineStrength: number;
  surfaceDistortionStrength: number;
  surfaceTextureStrength: number;
}

export interface GlobeQualityConfig {
  reliefMapEnabled: boolean;
  reliefHeight: number;
  dayImageryEnabled: boolean;
  nightImageryEnabled: boolean;
  waterMaskEnabled: boolean;
  cityLightsEnabled: boolean;
  cityLightsIntensity: number;
  cityLightsThreshold: number;
  cityLightsGlow: number;
  cityLightsColor: string;
  lightPollutionEnabled: boolean;
  lightPollutionIntensity: number;
  lightPollutionSpread: number;
  lightPollutionColor: string;
  umbraDarkness: number;
  showLakes: boolean;
  showRivers: boolean;
  lakesOpacity: number;
  riversOpacity: number;
  riversWidth: number;
  lakesColor: string;
  riversColor: string;
}

export interface GlobeRenderConfig {
  cipherCountryTransitionOpacity: number;
  cipherFocusDelayMs: number;
  cipherHydroOverlayOpacity: number;
  cipherHydroTextureEffectOpacity: number;
  cipherMapAnnotationsOpacity: number;
  cipherScreenTransitionOverlayOpacity: number;
  cipherSelectedCountryOverlayOpacity: number;
  cipherTrafficOverlayOpacity: number;
  reliefStrengthMultiplier: number;
  slowScanlineStrength: number;
  standardCountryStrokeWidth: number;
  standardGraticuleLineWidth: number;
  standardSelectedCountryStrokeWidth: number;
}

export interface ThemePreview {
  sky: string;
  glow: string;
  ocean: string;
  land: string;
  accent: string;
}

export interface GlobeThemeSettings {
  globe: GlobePalette;
  quality: GlobeQualityConfig;
  render: GlobeRenderConfig;
}

export interface AppThemeDefinition {
  id: AppThemeId;
  label: string;
  description: string;
  mode: 'light' | 'dark';
  background: {
    app: string;
    panel: string;
    panelBorder: string;
    panelShadow: string;
    mutedPanel: string;
  };
  palette: {
    primary: string;
    secondary: string;
    backgroundDefault: string;
    backgroundPaper: string;
    textPrimary: string;
    textSecondary: string;
  };
  globe: GlobePalette;
  qualityDefaults: GlobeQualityConfig;
  render: GlobeRenderConfig;
  preview: ThemePreview;
}

export type ThemeSurfaceTone = 'panel' | 'muted' | 'elevated';

const headingFont = '"Alegreya Sans SC", "Nunito Sans", system-ui, sans-serif';
const atlasHeadingFont =
  '"Cinzel", "Alegreya Sans SC", "Nunito Sans", system-ui, sans-serif';

const defaultGlobeRenderConfig: GlobeRenderConfig = {
  cipherCountryTransitionOpacity: 0,
  cipherFocusDelayMs: 0,
  cipherHydroOverlayOpacity: 0,
  cipherHydroTextureEffectOpacity: 0,
  cipherMapAnnotationsOpacity: 0,
  cipherScreenTransitionOverlayOpacity: 0,
  cipherSelectedCountryOverlayOpacity: 0,
  cipherTrafficOverlayOpacity: 0,
  reliefStrengthMultiplier: 8,
  slowScanlineStrength: 0,
  standardCountryStrokeWidth: 1.2,
  standardGraticuleLineWidth: 1.2,
  standardSelectedCountryStrokeWidth: 1.6,
};

const cipherGlobeRenderConfig: GlobeRenderConfig = {
  ...defaultGlobeRenderConfig,
  cipherCountryTransitionOpacity: 1,
  cipherFocusDelayMs: 420,
  cipherHydroOverlayOpacity: 1,
  cipherHydroTextureEffectOpacity: 1,
  cipherMapAnnotationsOpacity: 1,
  cipherScreenTransitionOverlayOpacity: 1,
  cipherSelectedCountryOverlayOpacity: 1,
  cipherTrafficOverlayOpacity: 1,
  slowScanlineStrength: 1,
};

export const appThemes: AppThemeDefinition[] = [
  {
    id: 'daybreak',
    label: 'Daybreak',
    description: 'Clear air, pale seas, and bright control surfaces.',
    mode: 'light',
    background: {
      app: 'radial-gradient(circle at top left, rgba(255,255,255,0.86), rgba(255,255,255,0) 24%), linear-gradient(145deg, #ecf6ff 0%, #dceeff 48%, #c3e0ff 100%)',
      panel: 'rgba(255, 255, 255, 0.9)',
      panelBorder: 'rgba(36, 95, 154, 0.24)',
      panelShadow: '0 24px 60px rgba(44, 91, 140, 0.18)',
      mutedPanel: 'rgba(248, 252, 255, 0.88)',
    },
    palette: {
      primary: '#0b6bcb',
      secondary: '#ff8a00',
      backgroundDefault: '#eef6ff',
      backgroundPaper: '#ffffff',
      textPrimary: '#133049',
      textSecondary: '#425f78',
    },
    globe: {
      oceanFill: '#dcefff',
      oceanDepth: '#cee2f4',
      oceanHighlight: '#8ed1ff',
      oceanHighlightOpacity: 0.04,
      countryElevation: 0,
      graticule: 'rgba(0, 0, 0, 0.12)',
      countryFill: '#9fc2a8',
      countryStroke: 'rgba(0, 0, 0, 0.35)',
      countryDebossDark: 'rgba(42, 77, 100, 0.18)',
      countryDebossLight: 'rgba(255, 255, 255, 0.24)',
      countryDebossWidth: 2,
      countryDebossOffset: 0.8,
      countryDebossStrength: 0.22,
      countryShadowColor: 'rgba(74, 116, 148, 0.12)',
      countryShadowBlur: 3,
      countryShadowOffsetX: 0.6,
      countryShadowOffsetY: 0.6,
      selectedFill: '#ffbc42',
      hazeOuter: '#eaf4ff',
      hazeInner: '#9ed8ff',
      nightShade: 'rgba(0, 0, 0, 0.28)',
      smallCountryCircle: 'rgba(217, 74, 51, 0.95)',
      gridColor: '#7bc5ff',
      gridStrength: 0.0,
      noiseStrength: 0.01,
      scanlineDensity: 180,
      scanlineStrength: 0.0,
      surfaceDistortionStrength: 0.45,
      surfaceTextureStrength: 0.55,
    },
    qualityDefaults: {
      reliefMapEnabled: false,
      reliefHeight: 1,
      dayImageryEnabled: false,
      nightImageryEnabled: false,
      waterMaskEnabled: false,
      cityLightsEnabled: false,
      cityLightsIntensity: 2.25,
      cityLightsThreshold: 0.04,
      cityLightsGlow: 1.6,
      cityLightsColor: '#fff3cf',
      lightPollutionEnabled: false,
      lightPollutionIntensity: 0.85,
      lightPollutionSpread: 1.8,
      lightPollutionColor: '#ffb46a',
      umbraDarkness: 0.35,
      showLakes: false,
      showRivers: false,
      lakesOpacity: 0.35,
      riversOpacity: 0.55,
      riversWidth: 0.9,
      lakesColor: '#5aaee8',
      riversColor: '#4a96d6',
    },
    render: defaultGlobeRenderConfig,
    preview: {
      sky: 'linear-gradient(140deg, #edf7ff, #c7e1ff)',
      glow: '#8dd7ff',
      ocean: '#dcefff',
      land: '#9fc2a8',
      accent: '#ffbc42',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Low-light interface with deep water and bright targets.',
    mode: 'dark',
    background: {
      app: 'radial-gradient(circle at top left, rgba(70,110,173,0.24), rgba(70,110,173,0) 22%), linear-gradient(145deg, #06131f 0%, #0b1f33 46%, #112a47 100%)',
      panel: 'rgba(9, 23, 38, 0.82)',
      panelBorder: 'rgba(129, 179, 255, 0.18)',
      panelShadow: '0 26px 64px rgba(0, 0, 0, 0.42)',
      mutedPanel: 'rgba(17, 38, 60, 0.78)',
    },
    palette: {
      primary: '#7bc4ff',
      secondary: '#ffb84d',
      backgroundDefault: '#08131f',
      backgroundPaper: '#102234',
      textPrimary: '#edf6ff',
      textSecondary: '#b6cade',
    },
    globe: {
      oceanFill: '#16324d',
      oceanDepth: '#0f2439',
      oceanHighlight: '#2b7ccc',
      oceanHighlightOpacity: 0.06,
      countryElevation: 0,
      graticule: 'rgba(210, 230, 255, 0.16)',
      countryFill: '#477f73',
      countryStroke: 'rgba(226, 240, 255, 0.28)',
      countryDebossDark: 'rgba(0, 0, 0, 0.24)',
      countryDebossLight: 'rgba(202, 238, 255, 0.18)',
      countryDebossWidth: 2,
      countryDebossOffset: 0.8,
      countryDebossStrength: 0.2,
      countryShadowColor: 'rgba(0, 0, 0, 0.2)',
      countryShadowBlur: 3,
      countryShadowOffsetX: 0.5,
      countryShadowOffsetY: 0.5,
      selectedFill: '#ffd166',
      hazeOuter: '#0b1a2c',
      hazeInner: '#245784',
      nightShade: 'rgba(0, 0, 0, 0.24)',
      smallCountryCircle: 'rgba(255, 127, 89, 0.96)',
      gridColor: '#7cd1ff',
      gridStrength: 0.04,
      noiseStrength: 0.05,
      scanlineDensity: 220,
      scanlineStrength: 0.0,
      surfaceDistortionStrength: 0.6,
      surfaceTextureStrength: 0.7,
    },
    qualityDefaults: {
      reliefMapEnabled: true,
      reliefHeight: 0.35,
      dayImageryEnabled: false,
      nightImageryEnabled: false,
      waterMaskEnabled: false,
      cityLightsEnabled: true,
      cityLightsIntensity: 1.4,
      cityLightsThreshold: 0.13,
      cityLightsGlow: 0.25,
      cityLightsColor: '#fff3cf',
      lightPollutionEnabled: true,
      lightPollutionIntensity: 0.2,
      lightPollutionSpread: 0.35,
      lightPollutionColor: '#ffb46a',
      umbraDarkness: 0.35,
      showLakes: true,
      showRivers: true,
      lakesOpacity: 0.35,
      riversOpacity: 0.55,
      riversWidth: 0.9,
      lakesColor: '#5aaee8',
      riversColor: '#4a96d6',
    },
    render: defaultGlobeRenderConfig,
    preview: {
      sky: 'linear-gradient(145deg, #08131f, #15314e)',
      glow: '#2d5f89',
      ocean: '#16324d',
      land: '#477f73',
      accent: '#ffd166',
    },
  },
  {
    id: 'ember',
    label: 'Ember',
    description: 'Warm dusk tones with copper highlights and dense atmosphere.',
    mode: 'dark',
    background: {
      app: 'radial-gradient(circle at top left, rgba(255, 181, 112, 0.22), rgba(255, 181, 112, 0) 26%), linear-gradient(145deg, #2a1614 0%, #51292b 46%, #7a4a3b 100%)',
      panel: 'rgba(46, 22, 20, 0.8)',
      panelBorder: 'rgba(255, 192, 138, 0.16)',
      panelShadow: '0 24px 64px rgba(21, 8, 6, 0.42)',
      mutedPanel: 'rgba(77, 37, 32, 0.78)',
    },
    palette: {
      primary: '#ffb66e',
      secondary: '#89d8ff',
      backgroundDefault: '#241311',
      backgroundPaper: '#4e2a25',
      textPrimary: '#fff1e8',
      textSecondary: '#f2c9b7',
    },
    globe: {
      oceanFill: '#6a362f',
      oceanDepth: '#4c2620',
      oceanHighlight: '#b4573f',
      oceanHighlightOpacity: 0.04,
      countryElevation: 0,
      graticule: 'rgba(255, 227, 210, 0.14)',
      countryFill: '#b67d55',
      countryStroke: 'rgba(40, 12, 7, 0.34)',
      countryDebossDark: 'rgba(55, 22, 14, 0.22)',
      countryDebossLight: 'rgba(255, 228, 196, 0.16)',
      countryDebossWidth: 2,
      countryDebossOffset: 0.8,
      countryDebossStrength: 0.18,
      countryShadowColor: 'rgba(47, 19, 12, 0.16)',
      countryShadowBlur: 3,
      countryShadowOffsetX: 0.5,
      countryShadowOffsetY: 0.5,
      selectedFill: '#8de1ff',
      hazeOuter: '#3b1f1d',
      hazeInner: '#d27d5a',
      nightShade: 'rgba(0, 0, 0, 0.2)',
      smallCountryCircle: 'rgba(255, 244, 160, 0.95)',
      gridColor: '#ffd1a3',
      gridStrength: 0.02,
      noiseStrength: 0.05,
      scanlineDensity: 170,
      scanlineStrength: 0.0,
      surfaceDistortionStrength: 0.68,
      surfaceTextureStrength: 0.78,
    },
    qualityDefaults: {
      reliefMapEnabled: true,
      reliefHeight: 0.35,
      dayImageryEnabled: false,
      nightImageryEnabled: false,
      waterMaskEnabled: false,
      cityLightsEnabled: true,
      cityLightsIntensity: 1.4,
      cityLightsThreshold: 0.13,
      cityLightsGlow: 0.25,
      cityLightsColor: '#ffe6d6',
      lightPollutionEnabled: true,
      lightPollutionIntensity: 0.2,
      lightPollutionSpread: 0.35,
      lightPollutionColor: '#ffb07b',
      umbraDarkness: 0.35,
      showLakes: true,
      showRivers: true,
      lakesOpacity: 0.35,
      riversOpacity: 0.55,
      riversWidth: 0.9,
      lakesColor: '#d27d5a',
      riversColor: '#ffb07b',
    },
    render: defaultGlobeRenderConfig,
    preview: {
      sky: 'linear-gradient(145deg, #2a1614, #99563d)',
      glow: '#d27d5a',
      ocean: '#6a362f',
      land: '#b67d55',
      accent: '#8de1ff',
    },
  },
  {
    id: 'atlas',
    label: 'Atlas',
    description:
      'Sun-faded adventure-map prop with parchment seas, dusted notes, and inked borders.',
    mode: 'light',
    background: {
      app: 'radial-gradient(circle at 15% 14%, rgba(255,247,230,0.76), rgba(255,247,230,0) 18%), radial-gradient(circle at 82% 16%, rgba(124, 96, 63, 0.12), rgba(124, 96, 63, 0) 21%), linear-gradient(145deg, #eadbbe 0%, #cdb68f 44%, #9d8461 100%)',
      panel: 'rgba(247, 240, 223, 0.9)',
      panelBorder: 'rgba(101, 78, 49, 0.24)',
      panelShadow: '0 24px 56px rgba(78, 60, 37, 0.16)',
      mutedPanel: 'rgba(239, 229, 207, 0.92)',
    },
    palette: {
      primary: '#5c4833',
      secondary: '#8a6745',
      backgroundDefault: '#dfcfb1',
      backgroundPaper: '#f2e8d3',
      textPrimary: '#3d2d1d',
      textSecondary: '#5d4b38',
    },
    globe: {
      oceanFill: '#d8ccb5',
      oceanDepth: '#c6b596',
      oceanHighlight: '#f2e7cf',
      oceanHighlightOpacity: 0.012,
      countryElevation: 0,
      graticule: 'rgba(87, 67, 46, 0.6)',
      countryFill: 'rgba(181, 176, 138, 0.28)',
      countryStroke: 'rgba(65, 47, 30, 0.42)',
      countryDebossDark: 'rgba(74, 53, 31, 0.12)',
      countryDebossLight: 'rgba(255, 248, 233, 0.12)',
      countryDebossWidth: 1.6,
      countryDebossOffset: 0.72,
      countryDebossStrength: 0.07,
      countryShadowColor: 'rgba(82, 64, 43, 0.05)',
      countryShadowBlur: 1.1,
      countryShadowOffsetX: 0.24,
      countryShadowOffsetY: 0.24,
      selectedFill: '#9d6a47',
      hazeOuter: '#efe4cf',
      hazeInner: '#cdb899',
      nightShade: 'rgba(54, 58, 67, 0.24)',
      smallCountryCircle: 'rgba(116, 47, 28, 0.94)',
      gridColor: '#8a7356',
      gridStrength: 0.0,
      noiseStrength: 0.008,
      scanlineDensity: 140,
      scanlineStrength: 0.0,
      surfaceDistortionStrength: 0.28,
      surfaceTextureStrength: 0.3,
    },
    qualityDefaults: {
      reliefMapEnabled: false,
      reliefHeight: 0.8,
      dayImageryEnabled: false,
      nightImageryEnabled: false,
      waterMaskEnabled: false,
      cityLightsEnabled: false,
      cityLightsIntensity: 1.15,
      cityLightsThreshold: 0.18,
      cityLightsGlow: 0.8,
      cityLightsColor: '#d8c8a8',
      lightPollutionEnabled: false,
      lightPollutionIntensity: 0.2,
      lightPollutionSpread: 0.8,
      lightPollutionColor: '#8f7f6a',
      umbraDarkness: 0.3,
      showLakes: true,
      showRivers: true,
      lakesOpacity: 0.12,
      riversOpacity: 0.18,
      riversWidth: 0.65,
      lakesColor: '#b9a889',
      riversColor: '#a79272',
    },
    render: {
      ...defaultGlobeRenderConfig,
      reliefStrengthMultiplier: 16,
    },
    preview: {
      sky: 'linear-gradient(145deg, #f3ead8, #ceb996)',
      glow: '#e4d8be',
      ocean: '#d6c7aa',
      land: '#b7af8d',
      accent: '#a96c46',
    },
  },
  {
    id: 'cipher',
    label: 'Cipher',
    description:
      'Elite terminal green, encrypted glow, and tactical scanlines.',
    mode: 'dark',
    background: {
      app: 'radial-gradient(circle at top left, rgba(0, 255, 163, 0.16), rgba(0, 255, 163, 0) 24%), radial-gradient(circle at 78% 18%, rgba(122, 245, 255, 0.12), rgba(122, 245, 255, 0) 22%), linear-gradient(145deg, #020907 0%, #051713 44%, #09251e 100%)',
      panel: 'rgba(5, 19, 16, 0.68)',
      panelBorder: 'rgba(84, 255, 188, 0.22)',
      panelShadow: '0 24px 72px rgba(0, 0, 0, 0.46)',
      mutedPanel: 'rgba(9, 29, 24, 0.7)',
    },
    palette: {
      primary: '#59ffb1',
      secondary: '#7af5ff',
      backgroundDefault: '#030b09',
      backgroundPaper: '#071813',
      textPrimary: '#e6fff4',
      textSecondary: '#9ad5c1',
    },
    globe: {
      oceanFill: '#041512',
      oceanDepth: '#02100d',
      oceanHighlight: '#18f4c5',
      oceanHighlightOpacity: 0.18,
      countryElevation: 0,
      graticule: 'rgba(117, 255, 196, 0.24)',
      countryFill: '#0b5b47',
      countryStroke: 'rgba(170, 255, 226, 0.42)',
      countryDebossDark: 'rgba(0, 0, 0, 0.4)',
      countryDebossLight: 'rgba(126, 255, 213, 0.24)',
      countryDebossWidth: 2.2,
      countryDebossOffset: 0.9,
      countryDebossStrength: 0.34,
      countryShadowColor: 'rgba(0, 0, 0, 0.34)',
      countryShadowBlur: 5,
      countryShadowOffsetX: 0.8,
      countryShadowOffsetY: 0.8,
      selectedFill: '#dfff72',
      hazeOuter: '#020907',
      hazeInner: '#0e5f49',
      nightShade: 'rgba(0, 9, 7, 0.42)',
      smallCountryCircle: 'rgba(89, 255, 177, 0.96)',
      gridColor: '#64ffd7',
      gridStrength: 0.38,
      noiseStrength: 0.14,
      scanlineDensity: 360,
      scanlineStrength: 0.28,
      surfaceDistortionStrength: 0.08,
      surfaceTextureStrength: 0.1,
    },
    qualityDefaults: {
      reliefMapEnabled: true,
      reliefHeight: 0.05,
      dayImageryEnabled: false,
      nightImageryEnabled: false,
      waterMaskEnabled: false,
      cityLightsEnabled: true,
      cityLightsIntensity: 1.1,
      cityLightsThreshold: 0.33,
      cityLightsGlow: 0.9,
      cityLightsColor: '#c7fff0',
      lightPollutionEnabled: true,
      lightPollutionIntensity: 0.15,
      lightPollutionSpread: 0.35,
      lightPollutionColor: '#39ff8f',
      umbraDarkness: 0.1,
      showLakes: true,
      showRivers: true,
      lakesOpacity: 0.4,
      riversOpacity: 0.4,
      riversWidth: 0.5,
      lakesColor: '#00ffec',
      riversColor: '#00ffec',
    },
    render: cipherGlobeRenderConfig,
    preview: {
      sky: 'linear-gradient(145deg, #020907, #0b3025)',
      glow: '#7cffdb',
      ocean: '#041512',
      land: '#0b5b47',
      accent: '#dfff72',
    },
  },
  {
    id: 'glacier',
    label: 'Glacier',
    description: 'Cold glass, frosted highlights, and aero-like blue haze.',
    mode: 'light',
    background: {
      app: 'radial-gradient(circle at 14% 10%, rgba(255,255,255,0.92), rgba(255,255,255,0) 24%), radial-gradient(circle at 82% 16%, rgba(88, 201, 255, 0.22), rgba(88, 201, 255, 0) 24%), linear-gradient(155deg, #f5fbff 0%, #dfeefe 42%, #c7e0fb 100%)',
      panel: 'rgba(244, 250, 255, 0.78)',
      panelBorder: 'rgba(87, 132, 173, 0.28)',
      panelShadow: '0 28px 72px rgba(124, 165, 206, 0.18)',
      mutedPanel: 'rgba(236, 246, 255, 0.84)',
    },
    palette: {
      primary: '#2a7fd8',
      secondary: '#7ad9ff',
      backgroundDefault: '#f2f9ff',
      backgroundPaper: '#fbfdff',
      textPrimary: '#17324a',
      textSecondary: '#4f6982',
    },
    globe: {
      oceanFill: 'rgb(230, 232, 237)',
      oceanDepth: '#e6eef5',
      oceanHighlight: '#6cd6ff',
      oceanHighlightOpacity: 0.26,
      countryElevation: 0.01,
      graticule: 'rgba(255, 255, 255, 0)',
      countryFill: '#f3f5f9',
      countryStroke: 'rgba(189, 208, 225, 0.92)',
      countryDebossDark: 'rgba(94, 128, 156, 0.34)',
      countryDebossLight: 'rgba(255, 255, 255, 0.92)',
      countryDebossWidth: 4.2,
      countryDebossOffset: 2.1,
      countryDebossStrength: 0,
      countryShadowColor: 'rgba(130, 130, 135, 0.24)',
      countryShadowBlur: 80,
      countryShadowOffsetX: 0,
      countryShadowOffsetY: 0,
      selectedFill: '#62d9ff',
      hazeOuter: '#e6f3ff',
      hazeInner: '#9fdbff',
      nightShade: 'rgba(34, 68, 104, 0.12)',
      smallCountryCircle: 'rgba(68, 148, 214, 0.74)',
      gridColor: '#ddf6ff',
      gridStrength: 0.0,
      noiseStrength: 0.01,
      scanlineDensity: 190,
      scanlineStrength: 0.0,
      surfaceDistortionStrength: 0.12,
      surfaceTextureStrength: 0.18,
    },
    qualityDefaults: {
      reliefMapEnabled: false,
      reliefHeight: 1,
      dayImageryEnabled: false,
      nightImageryEnabled: false,
      waterMaskEnabled: false,
      cityLightsEnabled: false,
      cityLightsIntensity: 0,
      cityLightsThreshold: 1,
      cityLightsGlow: 0,
      cityLightsColor: '#000000',
      lightPollutionEnabled: false,
      lightPollutionIntensity: 0,
      lightPollutionSpread: 0,
      lightPollutionColor: '#000000',
      umbraDarkness: 0.2,
      showLakes: false,
      showRivers: false,
      lakesOpacity: 0.35,
      riversOpacity: 0.55,
      riversWidth: 0.9,
      lakesColor: '#5aaee8',
      riversColor: '#4a96d6',
    },
    render: defaultGlobeRenderConfig,
    preview: {
      sky: 'linear-gradient(145deg, #f6fbff, #cfe5fb)',
      glow: '#73d7ff',
      ocean: '#f4f8fb',
      land: '#ffffff',
      accent: '#62d9ff',
    },
  },
];

export const defaultAppThemeId: AppThemeId = 'daybreak';

export function getAppThemeDefinition(themeId: AppThemeId): AppThemeDefinition {
  return appThemes.find((theme) => theme.id === themeId) ?? appThemes[0]!;
}

export function getThemeSurfaceStyles(
  definition: AppThemeDefinition,
  tone: ThemeSurfaceTone = 'panel',
) {
  const isAtlas = definition.id === 'atlas';
  const isGlacier = definition.id === 'glacier';
  const backgroundColor =
    tone === 'muted'
      ? definition.background.mutedPanel
      : definition.background.panel;

  return {
    backdropFilter: isGlacier
      ? 'blur(22px) saturate(1.45)'
      : isAtlas
        ? 'blur(8px) saturate(0.9)'
        : 'blur(18px)',
    backgroundColor,
    backgroundImage:
      tone === 'elevated'
        ? `linear-gradient(180deg, rgba(255,255,255,${
            definition.mode === 'light' ? '0.16' : '0.08'
          }), rgba(255,255,255,0))`
        : isGlacier
          ? 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(240,247,255,0.34))'
          : isAtlas
            ? 'linear-gradient(180deg, rgba(255,248,230,0.58), rgba(230,208,169,0.16))'
            : 'none',
    border: `1px solid ${definition.background.panelBorder}`,
    boxShadow:
      tone === 'elevated'
        ? `0 20px 48px ${
            definition.mode === 'light'
              ? 'rgba(40, 66, 95, 0.14)'
              : 'rgba(0, 0, 0, 0.32)'
          }, ${definition.background.panelShadow}`
        : definition.background.panelShadow,
    overflow: isAtlas ? 'hidden' : undefined,
    position: 'relative' as const,
  };
}

export function getThemeAccentSurfaceStyles(
  definition: AppThemeDefinition,
  emphasis: 'subtle' | 'strong' = 'subtle',
) {
  const tintOpacity = emphasis === 'strong' ? 0.24 : 0.14;
  const baseOpacity = emphasis === 'strong' ? 0.2 : 0.12;

  return {
    background: `linear-gradient(180deg, ${hexToRgba(
      definition.palette.primary,
      tintOpacity,
    )}, ${hexToRgba(definition.palette.secondary, baseOpacity)})`,
    border: `1px solid ${hexToRgba(definition.palette.primary, 0.24)}`,
    boxShadow: `inset 0 1px 0 ${hexToRgba(
      '#ffffff',
      definition.mode === 'light' ? 0.5 : 0.08,
    )}`,
  };
}

export function getThemeDisplaySurfaceStyles(
  definition: AppThemeDefinition,
  tone: 'neutral' | 'accent' = 'neutral',
) {
  if (tone === 'accent') {
    return {
      background: hexToRgba(
        definition.palette.primary,
        definition.mode === 'light' ? 0.14 : 0.22,
      ),
      border: `1px solid ${hexToRgba(definition.palette.primary, 0.34)}`,
      boxShadow: 'none',
    };
  }

  return {
    background: definition.background.mutedPanel,
    border: `1px solid ${hexToRgba(definition.palette.textPrimary, 0.1)}`,
    boxShadow: 'none',
  };
}

function hexToRgba(value: string, alpha: number) {
  const hex = value.replace('#', '');

  if (hex.length !== 6) {
    return value;
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function hexToRgb(value: string) {
  const hex = value.replace('#', '');

  if (hex.length !== 6) {
    return null;
  }

  return {
    blue: Number.parseInt(hex.slice(4, 6), 16),
    green: Number.parseInt(hex.slice(2, 4), 16),
    red: Number.parseInt(hex.slice(0, 2), 16),
  };
}

function getRelativeLuminance(value: string) {
  const rgb = hexToRgb(value);

  if (!rgb) {
    return 0;
  }

  const transformChannel = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * transformChannel(rgb.red) +
    0.7152 * transformChannel(rgb.green) +
    0.0722 * transformChannel(rgb.blue)
  );
}

function getContrastRatio(foreground: string, background: string) {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function pickBestTextColor(background: string, candidates: string[]) {
  return candidates.reduce((bestCandidate, candidate) =>
    getContrastRatio(candidate, background) >
    getContrastRatio(bestCandidate, background)
      ? candidate
      : bestCandidate,
  );
}

export interface AppUiTheme {
  breakpoints: {
    down: (key: 'lg' | 'md' | 'sm' | 'xl' | 'xs') => string;
    up: (key: 'lg' | 'md' | 'sm' | 'xl' | 'xs') => string;
    values: {
      lg: number;
      md: number;
      sm: number;
      xl: number;
      xs: number;
    };
  };
  mode: 'dark' | 'light';
  palette: {
    action: {
      disabled: string;
      disabledBackground: string;
    };
    background: {
      default: string;
      paper: string;
    };
    divider: string;
    error: {
      contrastText: string;
      main: string;
    };
    primary: {
      contrastText: string;
      main: string;
    };
    secondary: {
      contrastText: string;
      main: string;
    };
    text: {
      disabled: string;
      primary: string;
      secondary: string;
    };
  };
  typography: {
    body1: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    body2: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    button: {
      fontFamily: string | undefined;
      fontSize: string;
      fontWeight: number;
      letterSpacing: string;
    };
    caption: {
      fontSize: string;
      fontWeight: number;
      letterSpacing: string;
      lineHeight: number;
    };
    h1: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      letterSpacing: string;
      lineHeight: number;
    };
    h2: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      letterSpacing: string;
      lineHeight: number;
    };
    h3: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      letterSpacing: string;
      lineHeight: number;
    };
    h4: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      letterSpacing: string;
      lineHeight: number;
    };
    h5: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    h6: {
      fontFamily: string;
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    overline: {
      fontSize: string;
      fontWeight: number;
      letterSpacing: string;
      textTransform: 'uppercase';
    };
    subtitle1: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
    subtitle2: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
    };
  };
  vars: {
    palette: {
      divider: string;
    };
  };
  zIndex: {
    modal: number;
  };
}

export function createAppTheme(themeId: AppThemeId): AppUiTheme {
  const definition = getAppThemeDefinition(themeId);
  const isAtlas = definition.id === 'atlas';
  const divider = hexToRgba(
    definition.palette.textPrimary,
    definition.mode === 'light' ? 0.18 : 0.26,
  );
  const disabledText = hexToRgba(
    definition.palette.textPrimary,
    definition.mode === 'light' ? 0.54 : 0.66,
  );
  const disabledBackground = hexToRgba(
    definition.palette.textPrimary,
    definition.mode === 'light' ? 0.08 : 0.16,
  );
  const errorMain = definition.mode === 'light' ? '#b53a30' : '#ff9f8c';
  const errorContrastText = pickBestTextColor(errorMain, [
    '#fffdf7',
    definition.palette.backgroundDefault,
    definition.palette.textPrimary,
  ]);
  const primaryContrastText = pickBestTextColor(definition.palette.primary, [
    '#fffdf7',
    definition.palette.backgroundDefault,
    definition.palette.textPrimary,
  ]);
  const secondaryContrastText = pickBestTextColor(definition.palette.secondary, [
    '#fffdf7',
    definition.palette.backgroundDefault,
    definition.palette.textPrimary,
  ]);

  return {
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
      down: (key) => `@media (max-width: ${{
        xs: 0,
        sm: 599.95,
        md: 899.95,
        lg: 1199.95,
        xl: 1535.95,
      }[key]}px)`,
      up: (key) => `@media (min-width: ${{
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      }[key]}px)`,
    },
    mode: definition.mode,
    palette: {
      action: {
        disabled: disabledText,
        disabledBackground,
      },
      background: {
        default: definition.palette.backgroundDefault,
        paper: definition.palette.backgroundPaper,
      },
      divider,
      error: {
        contrastText: errorContrastText,
        main: errorMain,
      },
      primary: {
        contrastText: primaryContrastText,
        main: definition.palette.primary,
      },
      secondary: {
        contrastText: secondaryContrastText,
        main: definition.palette.secondary,
      },
      text: {
        disabled: disabledText,
        primary: definition.palette.textPrimary,
        secondary: definition.palette.textSecondary,
      },
    },
    typography: {
      body1: {
        fontSize: designTokens.fontSize.md,
        fontWeight: designTokens.fontWeight.regular,
        lineHeight: designTokens.lineHeight.base,
      },
      body2: {
        fontSize: designTokens.fontSize.sm,
        fontWeight: designTokens.fontWeight.regular,
        lineHeight: designTokens.lineHeight.base,
      },
      button: {
        fontFamily: isAtlas ? atlasHeadingFont : undefined,
        fontSize: designTokens.fontSize.sm,
        fontWeight: designTokens.fontWeight.semibold,
        letterSpacing: isAtlas ? '0.08em' : '0.03em',
      },
      caption: {
        fontSize: designTokens.fontSize.xs,
        fontWeight: designTokens.fontWeight.medium,
        letterSpacing: '0.02em',
        lineHeight: designTokens.lineHeight.base,
      },
      h1: {
        fontFamily: isAtlas ? atlasHeadingFont : headingFont,
        fontSize: designTokens.fontSize.xxxl,
        fontWeight: designTokens.fontWeight.bold,
        letterSpacing: isAtlas ? '0.06em' : '0.02em',
        lineHeight: designTokens.lineHeight.tight,
      },
      h2: {
        fontFamily: isAtlas ? atlasHeadingFont : headingFont,
        fontSize: designTokens.fontSize.xxl,
        fontWeight: designTokens.fontWeight.bold,
        letterSpacing: isAtlas ? '0.05em' : '0.02em',
        lineHeight: designTokens.lineHeight.tight,
      },
      h3: {
        fontFamily: isAtlas ? atlasHeadingFont : headingFont,
        fontSize: designTokens.fontSize.xl,
        fontWeight: designTokens.fontWeight.bold,
        letterSpacing: isAtlas ? '0.07em' : '0.03em',
        lineHeight: designTokens.lineHeight.tight,
      },
      h4: {
        fontFamily: isAtlas ? atlasHeadingFont : headingFont,
        fontSize: designTokens.fontSize.lg,
        fontWeight: designTokens.fontWeight.semibold,
        letterSpacing: isAtlas ? '0.05em' : '0.02em',
        lineHeight: designTokens.lineHeight.tight,
      },
      h5: {
        fontFamily: isAtlas ? atlasHeadingFont : headingFont,
        fontSize: designTokens.fontSize.lg,
        fontWeight: designTokens.fontWeight.semibold,
        lineHeight: designTokens.lineHeight.tight,
      },
      h6: {
        fontFamily: isAtlas ? atlasHeadingFont : headingFont,
        fontSize: designTokens.fontSize.md,
        fontWeight: designTokens.fontWeight.semibold,
        lineHeight: designTokens.lineHeight.tight,
      },
      overline: {
        fontSize: designTokens.fontSize.overline,
        fontWeight: designTokens.fontWeight.semibold,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      },
      subtitle1: {
        fontSize: designTokens.fontSize.md,
        fontWeight: designTokens.fontWeight.semibold,
        lineHeight: designTokens.lineHeight.tight,
      },
      subtitle2: {
        fontSize: designTokens.fontSize.sm,
        fontWeight: designTokens.fontWeight.semibold,
        lineHeight: designTokens.lineHeight.tight,
      },
    },
    vars: {
      palette: {
        divider,
      },
    },
    zIndex: {
      modal: 1300,
    },
  };
}
