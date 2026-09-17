import { memo } from 'react';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import type { User } from '../model/types';
import { USERS_COLUMNS } from '../constants/usersColumns';

type UsersTableRowProps = {
  user: User;
};

const rowHeaderSx = { fontWeight: 'medium' } as const;

/**
 * Memoised because a row is a pure function of its user, and the table re-renders
 * whenever anything around it changes. Measured: a sort click rendered ten rows whose
 * props had not changed.
 */
export const UsersTableRow = memo(function UsersTableRow({ user }: UsersTableRowProps) {
  return (
    <TableRow hover>
      {USERS_COLUMNS.map((column) =>
        column.isRowHeader === true ? (
          <TableCell key={column.id} component="th" scope="row" sx={rowHeaderSx}>
            {column.value(user)}
          </TableCell>
        ) : (
          <TableCell key={column.id}>{column.value(user)}</TableCell>
        ),
      )}
    </TableRow>
  );
});
