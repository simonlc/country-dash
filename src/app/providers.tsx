import { CssBaseline, ThemeProvider } from '@mui/material';
import type { PropsWithChildren } from 'react';
import { AppearanceProvider, useAppearance } from './appearance';
import { I18nProvider } from './i18n';

function ThemedProviders({ children }: PropsWithChildren) {
  const { muiTheme } = useAppearance();

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <I18nProvider>
      <AppearanceProvider>
        <ThemedProviders>{children}</ThemedProviders>
      </AppearanceProvider>
    </I18nProvider>
  );
}
