import type { ReactNode } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';

type ProvidersProps = {
  children: ReactNode;
};

/**
 * Every provider the app needs, in one place.
 *
 * The point of this file is that a test can render a component with the same
 * providers the app uses by importing one thing, and that adding a provider
 * later is an edit here rather than an edit to main.tsx and to every test.
 * The data client and the router will land here when they are needed.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      {/* Normalises the browser defaults and applies the background colour of
          whichever colour scheme is active. */}
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
