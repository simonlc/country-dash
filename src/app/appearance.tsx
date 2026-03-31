import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  appThemes,
  createAppTheme,
  defaultAppThemeId,
  getAppThemeDefinition,
  type AppThemeDefinition,
  type AppThemeId,
} from './theme';

const storageKey = 'country-guesser-theme';

interface AppearanceContextValue {
  activeTheme: AppThemeDefinition;
  muiTheme: ReturnType<typeof createAppTheme>;
  setTheme: (themeId: AppThemeId) => void;
  themes: AppThemeDefinition[];
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function getStoredThemeId(): AppThemeId {
  if (typeof window === 'undefined') {
    return defaultAppThemeId;
  }

  const storage = window.localStorage;
  const storedValue =
    storage && typeof storage.getItem === 'function'
      ? storage.getItem(storageKey)
      : null;
  return appThemes.some((theme) => theme.id === storedValue)
    ? (storedValue as AppThemeId)
    : defaultAppThemeId;
}

export function AppearanceProvider({ children }: PropsWithChildren) {
  const [themeId, setThemeId] = useState<AppThemeId>(getStoredThemeId);

  useEffect(() => {
    const storage = window.localStorage;
    if (storage && typeof storage.setItem === 'function') {
      storage.setItem(storageKey, themeId);
    }
  }, [themeId]);

  const value = useMemo(
    () => ({
      activeTheme: getAppThemeDefinition(themeId),
      muiTheme: createAppTheme(themeId),
      setTheme: setThemeId,
      themes: appThemes,
    }),
    [themeId],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used inside AppearanceProvider');
  }
  return context;
}
