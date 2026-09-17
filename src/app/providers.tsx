import { useState, type ReactNode } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { createQueryClient } from './queryClient';
import { theme } from './theme';

type ProvidersProps = {
  children: ReactNode;
  /**
   * Only for tests, which want a cache that starts empty for every case. The
   * app never passes one.
   */
  queryClient?: QueryClient;
};

/**
 * Every provider the app needs, in one place.
 *
 * The point of this file is that a test renders a component with the same
 * providers the app uses by importing one thing, and that adding a provider
 * later is an edit here rather than an edit to main.tsx and to every test.
 */
export function Providers({ children, queryClient }: ProvidersProps) {
  /* Created through useState rather than at module load or inline. Inline would
     build a new client on every render and throw the cache away with it. At
     module load it would be shared between tests. */
  const [client] = useState(() => queryClient ?? createQueryClient());

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>
        {/* Normalises the browser defaults and applies the background colour of
            whichever colour scheme is active. */}
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
