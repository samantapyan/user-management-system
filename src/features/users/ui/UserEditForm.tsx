import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { userEditFormSchema, type UserEditFormValues } from '../model/schemas';
import type { User } from '../model/types';
import { saveUserName } from '../model/userEdits';

type UserEditFormProps = {
  user: User;
  /** `persisted` is false when the browser accepted the change but would not store it. */
  onSaved: (persisted: boolean) => void;
  onCancel: () => void;
  /** So the dialog can ask before throwing away something half typed. */
  onDirtyChange: (isDirty: boolean) => void;
};

/** Sits where the heading was, so the field appears over the name it is replacing. */
const formSx = {
  display: 'flex',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 1,
  width: '100%',
};
const fieldSx = { flex: '1 1 200px' };

/**
 * Renaming one user. `userEditFormSchema` is the only place the rules live, so enabling
 * Save, the message under the field and the saved value cannot disagree. `onChange`
 * because Save is disabled while the value is invalid, and a dead button needs a reason.
 */
export function UserEditForm({
  user,
  onSaved,
  onCancel,
  onDirtyChange,
}: UserEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
  } = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: { name: user.name },
    mode: 'onChange',
  });

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <Box
      component="form"
      noValidate
      sx={formSx}
      onSubmit={(event) => {
        void handleSubmit((values) => {
          onSaved(saveUserName(user.id, values.name));
        })(event);
      }}
    >
      <TextField
        {...register('name')}
        label="Name"
        size="small"
        autoFocus
        sx={fieldSx}
        error={errors.name !== undefined}
        // A space rather than nothing, so the row does not change height the moment the
        // message appears and push the details below it.
        helperText={errors.name?.message ?? ' '}
      />

      <Button size="small" onClick={onCancel}>
        Cancel
      </Button>
      {/* Disabled while unchanged too: saving the name it already has would mark the user
          as locally edited for no reason, and that marker means something. */}
      <Button
        size="small"
        type="submit"
        variant="contained"
        disabled={!isValid || !isDirty}
      >
        Save
      </Button>
    </Box>
  );
}
