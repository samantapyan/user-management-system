import Box from '@mui/material/Box';
import { visuallyHidden } from '@mui/utils';

type LiveRegionProps = {
  message: string;
};

/**
 * Announces what is only visible on screen: sorting, or filtering down to three rows.
 * `polite` waits for a pause, which is right for a count and wrong for an error.
 */
export function LiveRegion({ message }: LiveRegionProps) {
  return (
    <Box role="status" aria-live="polite" sx={visuallyHidden}>
      {message}
    </Box>
  );
}
