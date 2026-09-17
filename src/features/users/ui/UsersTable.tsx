import type { ReactNode } from 'react';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import { LiveRegion } from '@/shared/ui/LiveRegion';
import { PAGE_SIZE_OPTIONS } from '../constants/pagination';
import { USERS_COLUMNS } from '../constants/usersColumns';
import type { User, UsersQuery, UsersTableQueryPatch } from '../model/types';
import { toPageSize } from '../model/usersParams';
import { UsersTableRow } from './UsersTableRow';

type UsersTableProps = {
  users: User[];
  total: number;
  query: UsersQuery;
  onQueryChange: (patch: UsersTableQueryPatch) => void;
  isLoading: boolean;
  /** The rows belong to the previous query and a newer one is in flight. */
  isStale: boolean;
  /** Shown in place of rows when there are none. The screen decides which message. */
  emptyState: ReactNode;
};

const paperSx = { overflow: 'hidden' } as const;
const pageSizes = [...PAGE_SIZE_OPTIONS];

/**
 * Presentational. Handed rows and a query, reports changes back, so it renders in a test
 * with no router and no network.
 */
export function UsersTable({
  users,
  total,
  query,
  onQueryChange,
  isLoading,
  isStale,
  emptyState,
}: UsersTableProps) {
  const isEmpty = !isLoading && users.length === 0;

  return (
    <Paper variant="outlined" sx={paperSx}>
      <LiveRegion
        message={
          isLoading
            ? 'Loading users'
            : `${total} ${total === 1 ? 'user' : 'users'}, sorted by name, ${
                query.sort === 'asc' ? 'ascending' : 'descending'
              }`
        }
      />

      {/* Focusable and labelled, because a region that scrolls has to be reachable
          without a mouse. Below the table's minimum width this is what the user drags. */}
      <TableContainer tabIndex={0} role="region" aria-label="Users, scrollable">
        <Table
          aria-label="Users"
          size="small"
          sx={{
            // Below this the columns squeeze until the text wraps, which makes rows
            // taller than the loading skeleton and moves everything under the table.
            // Scrolling sideways is the honest answer for four columns on a phone.
            minWidth: 640,
            // Every row is exactly one line. A wrapped cell makes its row taller than
            // the loading skeleton, which moves everything below the table when the data
            // arrives. Scrolling is better than truncating here: a half shown email
            // address is not something a user can read.
            '& th, & td': { whiteSpace: 'nowrap' },
            // Dimmed rather than replaced, so the table does not flash empty between
            // queries and the layout does not jump.
            opacity: isStale ? 0.5 : 1,
            transition: 'opacity 150ms',
          }}
        >
          <TableHead>
            <TableRow>
              {USERS_COLUMNS.map((column) => (
                // `sortDirection` is what puts aria-sort on the header, which is how a
                // screen reader is told the column is sorted and which way.
                <TableCell
                  key={column.id}
                  sortDirection={column.sortable === true ? query.sort : false}
                  sx={{ width: column.width }}
                >
                  {column.sortable === true ? (
                    <TableSortLabel
                      active
                      direction={query.sort}
                      onClick={() =>
                        onQueryChange({ sort: query.sort === 'asc' ? 'desc' : 'asc' })
                      }
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading &&
              Array.from({ length: query.pageSize }, (_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {USERS_COLUMNS.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading &&
              users.map((user) => <UsersTableRow key={user.id} user={user} />)}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Outside the scroll container on purpose. Inside it, the message would be
          centred across the table's minimum width and sit off screen on a phone. */}
      {isEmpty && emptyState}

      <TablePagination
        component="div"
        count={total}
        // MUI counts pages from zero, the URL and the query count from one.
        page={query.page - 1}
        onPageChange={(_, zeroBased) => onQueryChange({ page: zeroBased + 1 })}
        rowsPerPage={query.pageSize}
        rowsPerPageOptions={pageSizes}
        onRowsPerPageChange={(event) =>
          onQueryChange({ pageSize: toPageSize(event.target.value) })
        }
      />
    </Paper>
  );
}
