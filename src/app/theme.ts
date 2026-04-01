import { createTheme, type Theme } from '@mui/material/styles';

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
  atmosphereTint: string;
  gridColor: string;
  rimLightColor: string;
  specularColor: string;
  atmosphereOpacity: number;
  auroraStrength: number;
  gridStrength: number;
  noiseStrength: number;
  rimLightStrength: number;
  scanlineDensity: number;
  scanlineStrength: number;
  specularPower: number;
  specularStrength: number;
}

export interface ThemePreview {
  sky: string;
  glow: string;
  ocean: string;
  land: string;
  accent: string;
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
  preview: ThemePreview;
}

const headingFont = '"Alegreya Sans SC", "Nunito Sans", system-ui, sans-serif';
const bodyFont = '"Nunito Sans", system-ui, sans-serif';

export const appThemes: AppThemeDefinition[] = [
  {
    id: 'daybreak',
    label: 'Daybreak',
    description: 'Clear air, pale seas, and bright control surfaces.',
    mode: 'light',
    background: {
      app: 'radial-gradient(circle at top left, rgba(255,255,255,0.86), rgba(255,255,255,0) 24%), linear-gradient(145deg, #ecf6ff 0%, #dceeff 48%, #c3e0ff 100%)',
      panel: 'rgba(255, 255, 255, 0.82)',
      panelBorder: 'rgba(36, 95, 154, 0.18)',
      panelShadow: '0 24px 60px rgba(44, 91, 140, 0.18)',
      mutedPanel: 'rgba(248, 252, 255, 0.76)',
    },
    palette: {
      primary: '#0b6bcb',
      secondary: '#ff8a00',
      backgroundDefault: '#eef6ff',
      backgroundPaper: '#ffffff',
      textPrimary: '#133049',
      textSecondary: '#4f6b84',
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
      atmosphereTint: '#f5fbff',
      gridColor: '#7bc5ff',
      rimLightColor: '#f9fdff',
      specularColor: '#ffffff',
      atmosphereOpacity: 0.02,
      auroraStrength: 0.0,
      gridStrength: 0.0,
      noiseStrength: 0.01,
      rimLightStrength: 0.015,
      scanlineDensity: 180,
      scanlineStrength: 0.0,
      specularPower: 20,
      specularStrength: 0.0,
    },
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
      atmosphereTint: '#5da9ff',
      gridColor: '#7cd1ff',
      rimLightColor: '#8ad7ff',
      specularColor: '#cfe9ff',
      atmosphereOpacity: 0.16,
      auroraStrength: 0.04,
      gridStrength: 0.04,
      noiseStrength: 0.05,
      rimLightStrength: 0.16,
      scanlineDensity: 220,
      scanlineStrength: 0.015,
      specularPower: 28,
      specularStrength: 0.1,
    },
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
      atmosphereTint: '#ffb07b',
      gridColor: '#ffd1a3',
      rimLightColor: '#ffe6d6',
      specularColor: '#fff0d7',
      atmosphereOpacity: 0.1,
      auroraStrength: 0.04,
      gridStrength: 0.02,
      noiseStrength: 0.05,
      rimLightStrength: 0.08,
      scanlineDensity: 170,
      scanlineStrength: 0.0,
      specularPower: 18,
      specularStrength: 0.04,
    },
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
    description: 'Cartographic paper, muted seas, and print-like contrast.',
    mode: 'light',
    background: {
      app: 'radial-gradient(circle at top left, rgba(255,255,255,0.7), rgba(255,255,255,0) 24%), linear-gradient(145deg, #f6efe0 0%, #eadfca 48%, #d9ccb5 100%)',
      panel: 'rgba(255, 250, 241, 0.84)',
      panelBorder: 'rgba(113, 87, 52, 0.2)',
      panelShadow: '0 24px 56px rgba(106, 79, 46, 0.16)',
      mutedPanel: 'rgba(246, 238, 224, 0.82)',
    },
    palette: {
      primary: '#725228',
      secondary: '#aa5f2b',
      backgroundDefault: '#f3ecdf',
      backgroundPaper: '#fffaf1',
      textPrimary: '#45331f',
      textSecondary: '#7b6244',
    },
    globe: {
      oceanFill: '#d5d1ba',
      oceanDepth: '#c4bda3',
      oceanHighlight: '#efe0b5',
      oceanHighlightOpacity: 0.03,
      countryElevation: 0,
      graticule: 'rgba(85, 61, 29, 0.16)',
      countryFill: '#8ea472',
      countryStroke: 'rgba(59, 44, 22, 0.32)',
      countryDebossDark: 'rgba(88, 71, 45, 0.16)',
      countryDebossLight: 'rgba(255, 249, 235, 0.18)',
      countryDebossWidth: 1.8,
      countryDebossOffset: 0.7,
      countryDebossStrength: 0.14,
      countryShadowColor: 'rgba(110, 90, 58, 0.08)',
      countryShadowBlur: 2,
      countryShadowOffsetX: 0.4,
      countryShadowOffsetY: 0.4,
      selectedFill: '#d27745',
      hazeOuter: '#f2ebdf',
      hazeInner: '#ded2b3',
      nightShade: 'rgba(58, 41, 14, 0.12)',
      smallCountryCircle: 'rgba(160, 66, 34, 0.94)',
      atmosphereTint: '#f5efe1',
      gridColor: '#b09b6e',
      rimLightColor: '#fff8eb',
      specularColor: '#fff6de',
      atmosphereOpacity: 0.025,
      auroraStrength: 0.0,
      gridStrength: 0.0,
      noiseStrength: 0.01,
      rimLightStrength: 0.03,
      scanlineDensity: 140,
      scanlineStrength: 0.0,
      specularPower: 14,
      specularStrength: 0.03,
    },
    preview: {
      sky: 'linear-gradient(145deg, #f7f0e2, #dacdb0)',
      glow: '#e0cfab',
      ocean: '#d5d1ba',
      land: '#8ea472',
      accent: '#d27745',
    },
  },
  {
    id: 'cipher',
    label: 'Cipher',
    description:
      'Elite terminal green, encrypted glow, and tactical scanlines.',
    mode: 'dark',
    background: {
      app: 'radial-gradient(circle at top left, rgba(0, 255, 163, 0.16), rgba(0, 255, 163, 0) 24%), radial-gradient(circle at 78% 18%, rgba(48, 122, 255, 0.14), rgba(48, 122, 255, 0) 22%), linear-gradient(145deg, #020907 0%, #051713 44%, #09251e 100%)',
      panel: 'rgba(5, 19, 16, 0.68)',
      panelBorder: 'rgba(84, 255, 188, 0.22)',
      panelShadow: '0 24px 72px rgba(0, 0, 0, 0.46)',
      mutedPanel: 'rgba(9, 29, 24, 0.7)',
    },
    palette: {
      primary: '#59ffb1',
      secondary: '#5bc0ff',
      backgroundDefault: '#030b09',
      backgroundPaper: '#071813',
      textPrimary: '#e6fff4',
      textSecondary: '#8ebfa8',
    },
    globe: {
      oceanFill: '#041512',
      oceanDepth: '#02100d',
      oceanHighlight: '#00c7a2',
      oceanHighlightOpacity: 0.14,
      countryElevation: 0,
      graticule: 'rgba(117, 255, 196, 0.18)',
      countryFill: '#0d4f3e',
      countryStroke: 'rgba(155, 255, 219, 0.34)',
      countryDebossDark: 'rgba(0, 0, 0, 0.34)',
      countryDebossLight: 'rgba(126, 255, 213, 0.18)',
      countryDebossWidth: 2.2,
      countryDebossOffset: 0.9,
      countryDebossStrength: 0.28,
      countryShadowColor: 'rgba(0, 0, 0, 0.28)',
      countryShadowBlur: 4,
      countryShadowOffsetX: 0.7,
      countryShadowOffsetY: 0.7,
      selectedFill: '#7df7ff',
      hazeOuter: '#020907',
      hazeInner: '#0a3f32',
      nightShade: 'rgba(0, 8, 6, 0.32)',
      smallCountryCircle: 'rgba(89, 255, 177, 0.96)',
      atmosphereTint: '#59ffb1',
      gridColor: '#7affd3',
      rimLightColor: '#7affd3',
      specularColor: '#d9fff3',
      atmosphereOpacity: 0.3,
      auroraStrength: 0.28,
      gridStrength: 0.34,
      noiseStrength: 0.16,
      rimLightStrength: 0.28,
      scanlineDensity: 360,
      scanlineStrength: 0.2,
      specularPower: 42,
      specularStrength: 0.22,
    },
    preview: {
      sky: 'linear-gradient(145deg, #020907, #0b3025)',
      glow: '#1cffb5',
      ocean: '#041512',
      land: '#0d4f3e',
      accent: '#7df7ff',
    },
  },
  {
    id: 'glacier',
    label: 'Glacier',
    description: 'Cold glass, frosted highlights, and aero-like blue haze.',
    mode: 'light',
    background: {
      app: 'radial-gradient(circle at 14% 10%, rgba(255,255,255,0.92), rgba(255,255,255,0) 24%), radial-gradient(circle at 82% 16%, rgba(88, 201, 255, 0.22), rgba(88, 201, 255, 0) 24%), linear-gradient(155deg, #f5fbff 0%, #dfeefe 42%, #c7e0fb 100%)',
      panel: 'rgba(244, 250, 255, 0.48)',
      panelBorder: 'rgba(255, 255, 255, 0.62)',
      panelShadow: '0 28px 72px rgba(124, 165, 206, 0.18)',
      mutedPanel: 'rgba(236, 246, 255, 0.46)',
    },
    palette: {
      primary: '#2a7fd8',
      secondary: '#7ad9ff',
      backgroundDefault: '#f2f9ff',
      backgroundPaper: '#fbfdff',
      textPrimary: '#17324a',
      textSecondary: '#7088a2',
    },
    globe: {
      oceanFill: '#f4f8fb',
      oceanDepth: '#e6eef5',
      oceanHighlight: '#6cd6ff',
      oceanHighlightOpacity: 0.26,
      countryElevation: 0.01,
      graticule: 'rgba(255, 255, 255, 0)',
      countryFill: '#ffffff',
      countryStroke: 'rgba(245, 251, 255, 0.82)',
      countryDebossDark: 'rgba(94, 128, 156, 0.34)',
      countryDebossLight: 'rgba(255, 255, 255, 0.92)',
      countryDebossWidth: 4.2,
      countryDebossOffset: 2.1,
      countryDebossStrength: 0,
      countryShadowColor: 'rgba(130, 130, 135, 0.24)',
      countryShadowBlur: 42,
      countryShadowOffsetX: 0,
      countryShadowOffsetY: 0,
      selectedFill: '#62d9ff',
      hazeOuter: '#e6f3ff',
      hazeInner: '#9fdbff',
      nightShade: 'rgba(34, 68, 104, 0.12)',
      smallCountryCircle: 'rgba(68, 148, 214, 0.74)',
      atmosphereTint: '#f3fbff',
      gridColor: '#ddf6ff',
      rimLightColor: '#f7fdff',
      specularColor: '#ffffff',
      atmosphereOpacity: 0.04,
      auroraStrength: 0.0,
      gridStrength: 0.0,
      noiseStrength: 0.01,
      rimLightStrength: 0.028,
      scanlineDensity: 190,
      scanlineStrength: 0.0,
      specularPower: 52,
      specularStrength: 0.012,
    },
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

export function createAppTheme(themeId: AppThemeId): Theme {
  const definition = getAppThemeDefinition(themeId);
  const isGlacier = definition.id === 'glacier';

  return createTheme({
    cssVariables: true,
    colorSchemes: {
      [definition.mode]: {
        palette: {
          mode: definition.mode,
          primary: {
            main: definition.palette.primary,
          },
          secondary: {
            main: definition.palette.secondary,
          },
          background: {
            default: definition.palette.backgroundDefault,
            paper: definition.palette.backgroundPaper,
          },
          text: {
            primary: definition.palette.textPrimary,
            secondary: definition.palette.textSecondary,
          },
        },
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundAttachment: 'fixed',
            backgroundImage: definition.background.app,
            color: definition.palette.textPrimary,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backdropFilter: isGlacier
              ? 'blur(22px) saturate(1.45)'
              : 'blur(16px)',
            backgroundImage: isGlacier
              ? 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(240,247,255,0.34))'
              : 'none',
            boxShadow: isGlacier
              ? 'inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -20px 36px rgba(126, 194, 232, 0.08)'
              : undefined,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: isGlacier
            ? {
                backdropFilter: 'blur(26px) saturate(1.5)',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.76), rgba(235,245,255,0.42))',
                border: '1px solid rgba(255,255,255,0.82)',
                boxShadow:
                  '0 28px 80px rgba(104, 151, 191, 0.18), inset 0 1px 0 rgba(255,255,255,0.92), inset 0 -22px 40px rgba(144, 201, 237, 0.1)',
              }
            : undefined,
        },
      },
      MuiButton: {
        styleOverrides: {
          root: isGlacier
            ? {
                backdropFilter: 'blur(14px) saturate(1.35)',
                borderColor: 'rgba(255,255,255,0.82)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.9), 0 12px 24px rgba(112, 167, 210, 0.14)',
              }
            : undefined,
          contained: isGlacier
            ? {
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(205,235,255,0.76))',
                color: '#1b4f78',
              }
            : undefined,
          outlined: isGlacier
            ? {
                backgroundColor: 'rgba(255,255,255,0.3)',
              }
            : undefined,
        },
      },
    },
    palette: {
      mode: definition.mode,
      primary: {
        main: definition.palette.primary,
      },
      secondary: {
        main: definition.palette.secondary,
      },
      background: {
        default: definition.palette.backgroundDefault,
        paper: definition.palette.backgroundPaper,
      },
      text: {
        primary: definition.palette.textPrimary,
        secondary: definition.palette.textSecondary,
      },
    },
    shape: {
      borderRadius: 14,
    },
    typography: {
      fontFamily: bodyFont,
      h1: { fontFamily: headingFont, fontWeight: 700, letterSpacing: '0.02em' },
      h2: { fontFamily: headingFont, fontWeight: 700, letterSpacing: '0.02em' },
      h3: { fontFamily: headingFont, fontWeight: 700, letterSpacing: '0.03em' },
      h4: { fontFamily: headingFont, fontWeight: 700, letterSpacing: '0.02em' },
      button: { fontWeight: 700, letterSpacing: '0.03em' },
    },
  });
}
