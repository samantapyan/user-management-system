import Box from '@mui/material/Box';
import { visuallyHidden } from '@mui/utils';

type LiveRegionProps = {
  message: string;
};

/**
 * Announces a change that is only visible on screen.
 *
 * Sorting a table, or filtering it down to three rows, is obvious to someone looking at
 * it and completely silent to someone using a screen reader. `polite` waits for a pause
 * rather than interrupting, which is right for a result count and wrong for an error.
 */
export function LiveRegion({ message }: LiveRegionProps) {
  return (
    <Box role="status" aria-live="polite" sx={visuallyHidden}>
      {message}
    </Box>
  );
}
