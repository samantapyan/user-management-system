import { useState, type ReactNode } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { createQueryClient } from './queryClient';
import { theme } from './theme';

type ProvidersProps = {
  children: ReactNode;
  /** Only for tests, which want a cache that starts empty. The app never passes one. */
  queryClient?: QueryClient;
};

/** Every provider in one place, so a test can render with the same ones the app uses. */
export function Providers({ children, queryClient }: ProvidersProps) {
  // Inline would build a new client on every render and throw the cache away with it.
  const [client] = useState(() => queryClient ?? createQueryClient());

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
