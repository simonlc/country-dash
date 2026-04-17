import type { PropsWithChildren } from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { CssBaseline, ThemeProvider } from '@/components/ui/theme-provider';
import { AppearanceProvider, useAppearance } from './appearance';
import { I18nProvider } from './i18n';

function ThemedProviders({ children }: PropsWithChildren) {
  const { activeTheme, uiTheme } = useAppearance();

  return (
    <ThemeProvider activeTheme={activeTheme} theme={uiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <JotaiProvider>
      <I18nProvider>
        <AppearanceProvider>
          <ThemedProviders>{children}</ThemedProviders>
        </AppearanceProvider>
      </I18nProvider>
    </JotaiProvider>
  );
}
