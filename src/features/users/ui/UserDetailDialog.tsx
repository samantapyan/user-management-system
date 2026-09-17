import { useState, type ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import { errorMessage } from '@/shared/lib/http';
import { useUserQuery } from '../api/useUserQuery';
import { USER_DETAIL_FIELDS } from '../constants/userDetailFields';
import { findEdit } from '../model/applyEdits';
import type { User } from '../model/types';
import { revertUser, useUserEdits } from '../model/userEdits';
import { UserEditForm } from './UserEditForm';

const TITLE_ID = 'user-detail-title';
/*
 * MUI stamps the dialog's `aria-labelledby` value onto `DialogTitle` unless it is given
 * an id of its own, which put the same id on the block and on the heading inside it. Two
 * elements answered to it, the outer one won, and the dialog's accessible name became the
 * heading plus every word of the form.
 */
const TITLE_BLOCK_ID = 'user-detail-title-block';
const DISCARD_TITLE_ID = 'discard-edit-title';

type UserDetailDialogProps = {
  userId: number;
  /** The row that was clicked, when there was one. Absent on a shared link. */
  fromRow: User | undefined;
  onClose: () => void;
};

/*
 * One line, and the name is what gives way. A renamed user can be sixty characters long,
 * and with wrapping the pencil left the heading and went to a line of its own, which put
 * the control for a thing below the thing it controls.
 *
 * While editing the heading is `position: absolute`, so it stops being a flex item and
 * the form is the only one left, which is why the same row works for both states.
 */
const titleSx = { display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: 1 };

/** `minWidth: 0` is the part that is easy to miss: without it a flex item never shrinks
 *  below its content, so the text runs past the dialog instead of ending in an ellipsis. */
const headingSx = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

/** The pencil and the marker keep their size; the name is the only thing that shortens. */
const controlsSx = { display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 };
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
  const isEdited = findEdit(useUserEdits(), userId) !== undefined;

  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedInput, setHasUnsavedInput] = useState(false);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [storageRefused, setStorageRefused] = useState(false);

  function leaveEditMode(): void {
    setIsEditing(false);
    setHasUnsavedInput(false);
    setIsConfirmingDiscard(false);
  }

  /*
   * Closing with something half typed asks first. The alternative people reach for is to
   * keep the draft and put it back next time, and that is worse: text the user walked
   * away from reappears later with no explanation, and they cannot tell it from a value
   * that was actually saved.
   */
  function requestClose(): void {
    if (isEditing && hasUnsavedInput) {
      setIsConfirmingDiscard(true);
      return;
    }
    onClose();
  }

  return (
    <Dialog
      open
      onClose={requestClose}
      aria-labelledby={TITLE_ID}
      fullWidth
      maxWidth="sm"
    >
      {/* A div, because while editing this holds a form, and a form inside an `h2` is
          not valid HTML. The heading is still in there, as its own element. */}
      <DialogTitle component="div" id={TITLE_BLOCK_ID} sx={titleSx}>
        {/*
         * Never removed, only hidden, because it is what names the dialog. Take it out
         * of the tree while editing and `aria-labelledby` points at nothing, so a screen
         * reader announces an unnamed dialog at exactly the moment the user is changing
         * the name of something.
         */}
        <Typography
          component="h2"
          variant="inherit"
          id={TITLE_ID}
          sx={isEditing ? visuallyHidden : headingSx}
          // The full name for a mouse, since the visible text may be cut short. A screen
          // reader already gets it in full from the element itself.
          {...(user === null ? {} : { title: user.name })}
        >
          {title(query.isPending, query.isError, user)}
        </Typography>

        {isEditing && user !== null ? (
          <UserEditForm
            user={user}
            onSaved={(persisted) => {
              setStorageRefused(!persisted);
              leaveEditMode();
            }}
            onCancel={leaveEditMode}
            onDirtyChange={setHasUnsavedInput}
          />
        ) : (
          <Box sx={controlsSx}>
            {user !== null && (
              <Tooltip title="Edit name">
                {/* Named after the user, because "Edit" on its own tells someone
                    listing the buttons on this page nothing about what it edits. */}
                <IconButton
                  size="small"
                  aria-label={`Edit the name of ${user.name}`}
                  onClick={() => {
                    setStorageRefused(false);
                    setIsEditing(true);
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </IconButton>
              </Tooltip>
            )}
            {isEdited && (
              // Says the name on screen is not the name the API returned. Without it a
              // renamed user is indistinguishable from one the server actually knows by
              // that name, which is the whole reason this is only a local edit.
              <Chip label="Edited here" size="small" variant="outlined" />
            )}
          </Box>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {storageRefused && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Your browser would not save this, so the change will be gone after a reload.
          </Alert>
        )}

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
        {/* Not offered mid-edit: undoing the saved name while typing a new one leaves
            the field holding a value that is no longer anything. */}
        {isEdited && !isEditing && (
          <Button
            onClick={() => {
              setStorageRefused(!revertUser(userId));
            }}
          >
            Undo rename
          </Button>
        )}
        <Button onClick={requestClose}>Close</Button>
      </DialogActions>

      <Dialog
        open={isConfirmingDiscard}
        onClose={() => setIsConfirmingDiscard(false)}
        aria-labelledby={DISCARD_TITLE_ID}
      >
        <DialogTitle id={DISCARD_TITLE_ID}>Discard your changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>The name you typed has not been saved.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmingDiscard(false)}>Keep editing</Button>
          <Button
            color="error"
            onClick={() => {
              leaveEditMode();
              onClose();
            }}
          >
            Discard
          </Button>
        </DialogActions>
      </Dialog>
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
