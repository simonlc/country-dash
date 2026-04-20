import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { designTokens } from '@/app/designSystem';
import {
  createAppTheme,
  type AppThemeDefinition,
  type AppUiTheme,
} from '@/app/theme';

const ThemeContext = createContext<AppUiTheme>(createAppTheme('daybreak'));

interface ThemeProviderProps extends PropsWithChildren {
  activeTheme: AppThemeDefinition;
  theme: AppUiTheme;
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

export function ThemeProvider({
  activeTheme,
  children,
  theme,
}: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;
    const isGlacier = activeTheme.id === 'glacier';
    const isAtlas = activeTheme.id === 'atlas';
    const surfacePanelImage = isGlacier
      ? 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(240,247,255,0.34))'
      : isAtlas
        ? 'linear-gradient(180deg, rgba(255,248,230,0.58), rgba(230,208,169,0.16))'
        : 'none';
    const surfaceElevatedImage = `linear-gradient(180deg, rgba(255,255,255,${
      activeTheme.mode === 'light' ? '0.16' : '0.08'
    }), rgba(255,255,255,0))`;
    const surfaceElevatedShadow = `0 20px 48px ${
      activeTheme.mode === 'light'
        ? 'rgba(40, 66, 95, 0.14)'
        : 'rgba(0, 0, 0, 0.32)'
    }, ${activeTheme.background.panelShadow}`;
    const surfacePanelBackdropFilter = isGlacier
      ? 'blur(22px) saturate(1.45)'
      : isAtlas
        ? 'blur(8px) saturate(0.9)'
        : 'blur(18px)';

    root.style.setProperty('--color-background', theme.palette.background.default);
    root.style.setProperty('--color-foreground', theme.palette.text.primary);
    root.style.setProperty('--color-card', theme.palette.background.paper);
    root.style.setProperty('--color-muted', theme.palette.text.secondary);
    root.style.setProperty('--color-primary', theme.palette.primary.main);
    root.style.setProperty(
      '--color-primary-contrast',
      theme.palette.primary.contrastText,
    );
    root.style.setProperty('--color-secondary', theme.palette.secondary.main);
    root.style.setProperty(
      '--color-secondary-contrast',
      theme.palette.secondary.contrastText,
    );
    root.style.setProperty('--color-border', theme.palette.divider);
    root.style.setProperty('--app-background', activeTheme.background.app);
    root.style.setProperty('--radius-sm', `${designTokens.radius.sm}px`);
    root.style.setProperty('--radius-md', `${designTokens.radius.md}px`);
    root.style.setProperty('--surface-panel-bg', activeTheme.background.panel);
    root.style.setProperty('--surface-panel-border', activeTheme.background.panelBorder);
    root.style.setProperty('--surface-panel-shadow', activeTheme.background.panelShadow);
    root.style.setProperty('--surface-panel-image', surfacePanelImage);
    root.style.setProperty('--surface-panel-backdrop-filter', surfacePanelBackdropFilter);
    root.style.setProperty('--surface-elevated-image', surfaceElevatedImage);
    root.style.setProperty('--surface-elevated-shadow', surfaceElevatedShadow);
    root.style.setProperty(
      '--surface-display-neutral-bg',
      activeTheme.background.mutedPanel,
    );
    root.style.setProperty(
      '--surface-display-neutral-border',
      hexToRgba(activeTheme.palette.textPrimary, 0.1),
    );
    root.style.setProperty(
      '--surface-display-accent-bg',
      hexToRgba(
        activeTheme.palette.primary,
        activeTheme.mode === 'light' ? 0.14 : 0.22,
      ),
    );
    root.style.setProperty(
      '--surface-display-accent-border',
      hexToRgba(activeTheme.palette.primary, 0.34),
    );
    root.dataset.theme = theme.mode;
  }, [activeTheme, theme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function CssBaseline() {
  return null;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useMediaQuery(query: string | ((theme: AppUiTheme) => string)) {
  const theme = useTheme();
  const resolvedQuery = typeof query === 'function' ? query(theme) : query;
  const normalizedQuery = resolvedQuery.startsWith('@media ')
    ? resolvedQuery.slice(7)
    : resolvedQuery;
  const supportsMatchMedia =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function';

  const [matches, setMatches] = useState(() =>
    supportsMatchMedia ? window.matchMedia(normalizedQuery).matches : false,
  );

  useEffect(() => {
    if (!supportsMatchMedia) {
      return;
    }

    const media = window.matchMedia(normalizedQuery);
    const listener = () => setMatches(media.matches);
    listener();
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [normalizedQuery, supportsMatchMedia]);

  return matches;
}
