import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { useRouteError } from 'react-router';
import { StatusBlock } from '@/shared/ui/StatusBlock';

/**
 * The last line of defence. Without it, anything thrown during render replaces the app
 * with a blank page and no way forward.
 */
export function RouteError() {
  const error = useRouteError();

  // The detail is for whoever is debugging, not for the person looking at the screen.
  console.error('Unhandled route error', error);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <StatusBlock
        title="Something went wrong"
        description="The page could not be displayed. Reloading usually fixes it."
        action={
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload the page
          </Button>
        }
      />
    </Container>
  );
}
