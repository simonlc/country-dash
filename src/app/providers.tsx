import { CssBaseline, ThemeProvider } from '@mui/material';
import type { PropsWithChildren } from 'react';
import { AppearanceProvider, useAppearance } from './appearance';

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
    <AppearanceProvider>
      <ThemedProviders>{children}</ThemedProviders>
    </AppearanceProvider>
  );
}
