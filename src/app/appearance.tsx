import { type PropsWithChildren, useCallback, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  appThemes,
  type AppThemeDefinition,
  type AppThemeId,
  type AppUiTheme,
} from './theme';
import {
  activeThemeAtom,
  themeIdAtom,
  uiThemeAtom,
} from '@/appearance/state/appearance-atoms';

interface AppearanceContextValue {
  activeTheme: AppThemeDefinition;
  setTheme: (themeId: AppThemeId) => void;
  themes: AppThemeDefinition[];
  uiTheme: AppUiTheme;
}

export function AppearanceProvider({ children }: PropsWithChildren) {
  return children;
}

export function useAppearance() {
  const activeTheme = useAtomValue(activeThemeAtom);
  const uiTheme = useAtomValue(uiThemeAtom);
  const setThemeValue = useSetAtom(themeIdAtom);
  const setTheme = useCallback(
    (themeId: AppThemeId) => {
      setThemeValue(themeId);
    },
    [setThemeValue],
  );

  return useMemo<AppearanceContextValue>(
    () => ({
      activeTheme,
      setTheme,
      themes: appThemes,
      uiTheme,
    }),
    [activeTheme, setTheme, uiTheme],
  );
}
