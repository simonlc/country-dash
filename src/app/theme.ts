import { createTheme, type Theme } from '@mui/material/styles';

export type AppThemeId = 'daybreak' | 'midnight' | 'ember' | 'atlas';

export interface GlobePalette {
  oceanFill: string;
  graticule: string;
  countryFill: string;
  countryStroke: string;
  selectedFill: string;
  hazeOuter: string;
  hazeInner: string;
  nightShade: string;
  smallCountryCircle: string;
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
      graticule: 'rgba(0, 0, 0, 0.12)',
      countryFill: '#9fc2a8',
      countryStroke: 'rgba(0, 0, 0, 0.35)',
      selectedFill: '#ffbc42',
      hazeOuter: '#eaf4ff',
      hazeInner: '#9ed8ff',
      nightShade: 'rgba(0, 0, 0, 0.18)',
      smallCountryCircle: 'rgba(217, 74, 51, 0.95)',
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
      graticule: 'rgba(210, 230, 255, 0.16)',
      countryFill: '#477f73',
      countryStroke: 'rgba(226, 240, 255, 0.28)',
      selectedFill: '#ffd166',
      hazeOuter: '#0b1a2c',
      hazeInner: '#245784',
      nightShade: 'rgba(0, 0, 0, 0.24)',
      smallCountryCircle: 'rgba(255, 127, 89, 0.96)',
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
      graticule: 'rgba(255, 227, 210, 0.14)',
      countryFill: '#b67d55',
      countryStroke: 'rgba(40, 12, 7, 0.34)',
      selectedFill: '#8de1ff',
      hazeOuter: '#3b1f1d',
      hazeInner: '#d27d5a',
      nightShade: 'rgba(0, 0, 0, 0.2)',
      smallCountryCircle: 'rgba(255, 244, 160, 0.95)',
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
      graticule: 'rgba(85, 61, 29, 0.16)',
      countryFill: '#8ea472',
      countryStroke: 'rgba(59, 44, 22, 0.32)',
      selectedFill: '#d27745',
      hazeOuter: '#f2ebdf',
      hazeInner: '#ded2b3',
      nightShade: 'rgba(58, 41, 14, 0.12)',
      smallCountryCircle: 'rgba(160, 66, 34, 0.94)',
    },
    preview: {
      sky: 'linear-gradient(145deg, #f7f0e2, #dacdb0)',
      glow: '#e0cfab',
      ocean: '#d5d1ba',
      land: '#8ea472',
      accent: '#d27745',
    },
  },
];

export const defaultAppThemeId: AppThemeId = 'daybreak';

export function getAppThemeDefinition(themeId: AppThemeId): AppThemeDefinition {
  return appThemes.find((theme) => theme.id === themeId) ?? appThemes[0]!;
}

export function createAppTheme(themeId: AppThemeId): Theme {
  const definition = getAppThemeDefinition(themeId);

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
            backdropFilter: 'blur(16px)',
          },
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
