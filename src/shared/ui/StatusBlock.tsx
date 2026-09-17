import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type StatusBlockProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

const rootSx = { alignItems: 'center', px: 3, py: 6, textAlign: 'center' } as const;
const titleSx = { fontWeight: 'medium' } as const;
const descriptionSx = { maxWidth: '40ch', color: 'text.secondary' } as const;

/**
 * The shape every "there is nothing here" message takes: a line saying what happened, an
 * optional line saying why, and an optional way out. One component, so an empty result, a
 * failed request and an empty dataset do not each invent their own layout.
 */
export function StatusBlock({ title, description, action }: StatusBlockProps) {
  return (
    <Stack spacing={1} sx={rootSx}>
      <Typography variant="subtitle1" sx={titleSx}>
        {title}
      </Typography>

      {description !== undefined && (
        <Typography variant="body2" sx={descriptionSx}>
          {description}
        </Typography>
      )}

      {action !== undefined && <Box sx={{ pt: 1 }}>{action}</Box>}
    </Stack>
  );
}
