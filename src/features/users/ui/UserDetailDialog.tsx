import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { errorMessage } from '@/shared/lib/http';
import { useUserQuery } from '../api/useUserQuery';
import { USER_DETAIL_FIELDS } from '../constants/userDetailFields';
import type { User } from '../model/types';

const TITLE_ID = 'user-detail-title';

type UserDetailDialogProps = {
  userId: number;
  /** The row that was clicked, when there was one. Absent on a shared link. */
  fromRow: User | undefined;
  onClose: () => void;
};

const listSx = { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' } };
const termSx = { gridColumn: { sm: 1 }, color: 'text.secondary', py: 0.75, pr: 3 };
const definitionSx = { gridColumn: { sm: 2 }, m: 0, py: { xs: 0, sm: 0.75 }, pb: 0.75 };

/**
 * Rendered only while a user is open, rather than kept mounted with `open={false}`.
 *
 * That trades MUI's closing animation for content that is never half gone: keeping it
 * mounted means the id becomes null while the dialog is still fading, and it fades out
 * empty. Reduced motion is respected elsewhere anyway, so an instant close is consistent.
 */
export function UserDetailDialog({ userId, fromRow, onClose }: UserDetailDialogProps) {
  const query = useUserQuery(userId, fromRow);
  const user = query.data ?? null;

  return (
    <Dialog open onClose={onClose} aria-labelledby={TITLE_ID} fullWidth maxWidth="sm">
      <DialogTitle id={TITLE_ID}>
        {title(query.isPending, query.isError, user)}
      </DialogTitle>

      <DialogContent dividers>
        {query.isError && <Typography>{errorMessage(query.error)}</Typography>}

        {/* The title already says what happened, so this only says why. */}
        {!query.isError && user === null && !query.isPending && (
          <Typography>
            This user may have been removed since the link was created.
          </Typography>
        )}

        {user !== null && (
          // A definition list, because these are label and value pairs. A screen reader
          // then reads "Email, Sincere at april dot biz" rather than two loose strings.
          <Box component="dl" sx={listSx}>
            {USER_DETAIL_FIELDS.map((field) => {
              const value = field.value(user);
              const href = field.href?.(user);

              return (
                <Box component="div" key={field.id} sx={{ display: 'contents' }}>
                  <Typography component="dt" variant="body2" sx={termSx}>
                    {field.label}
                  </Typography>
                  <Typography component="dd" variant="body2" sx={definitionSx}>
                    {href === undefined ? (
                      value
                    ) : (
                      <Link
                        href={href}
                        {...(field.external === true
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                      >
                        {value}
                      </Link>
                    )}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

/** Four situations, and only one of them is a skeleton. */
function title(isPending: boolean, isError: boolean, user: User | null): ReactNode {
  if (user !== null) {
    return user.name;
  }
  if (isError) {
    return 'Could not load this user';
  }
  return isPending ? <Skeleton /> : 'User not found';
}
