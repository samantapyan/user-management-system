import { memo } from 'react';
import IconButton from '@mui/material/IconButton';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { USERS_COLUMNS } from '../constants/usersColumns';
import type { User } from '../model/types';

type UsersTableRowProps = {
  user: User;
  onOpen: (id: number) => void;
};

const rowHeaderSx = { fontWeight: 'medium' } as const;
const actionCellSx = { textAlign: 'right', py: 0 } as const;

/**
 * Memoised because a row is a pure function of its props, and the table re-renders
 * whenever anything around it changes. Measured: a sort click rendered ten rows whose
 * props had not changed.
 */
export const UsersTableRow = memo(function UsersTableRow({
  user,
  onOpen,
}: UsersTableRowProps) {
  return (
    <TableRow hover>
      {USERS_COLUMNS.map((column) => {
        if (column.kind === 'actions') {
          return (
            <TableCell key={column.id} sx={actionCellSx}>
              {/* Named per row rather than "View details" ten times over. A screen reader
                  user listing the buttons on this page hears which user each one opens. */}
              <IconButton
                size="small"
                aria-label={`View details for ${user.name}`}
                onClick={() => onOpen(user.id)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </IconButton>
            </TableCell>
          );
        }

        return column.isRowHeader === true ? (
          <TableCell key={column.id} component="th" scope="row" sx={rowHeaderSx}>
            {column.value(user)}
          </TableCell>
        ) : (
          <TableCell key={column.id}>{column.value(user)}</TableCell>
        );
      })}
    </TableRow>
  );
});
