import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
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
import { StatusBlock } from '@/shared/ui/StatusBlock';
import { PAGE_SIZE_OPTIONS } from '../constants/pagination';
import { SORTABLE_COLUMN_ID, USERS_COLUMNS } from '../constants/usersColumns';
import type { UsersQuery, UsersTableQueryPatch } from '../model/types';
import { toPageSize } from '../model/usersParams';
import type { UsersViewState } from '../model/usersViewState';
import { UsersTableRow } from './UsersTableRow';

/** The error state replaces the table rather than appearing inside it. */
type UsersTableState = Exclude<UsersViewState, { status: 'error' }>;

type UsersTableProps = {
  state: UsersTableState;
  query: UsersQuery;
  onQueryChange: (patch: UsersTableQueryPatch) => void;
  onClearFilters: () => void;
  onRetry: () => void;
};

const paperSx = { overflow: 'hidden' } as const;
const pageSizes = [...PAGE_SIZE_OPTIONS];

export function UsersTable({
  state,
  query,
  onQueryChange,
  onClearFilters,
  onRetry,
}: UsersTableProps) {
  const total = state.status === 'ready' ? state.total : 0;
  const isRefreshing = state.status === 'ready' && state.isRefreshing;

  return (
    <Paper variant="outlined" sx={paperSx}>
      <LiveRegion message={announce(state, query)} />

      {state.status === 'ready' && state.refreshFailed && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          }
        >
          Could not refresh. These rows may be out of date.
        </Alert>
      )}

      {/* Focusable and labelled, because a region that scrolls has to be reachable
          without a mouse. Below the table's minimum width this is what the user drags. */}
      <TableContainer tabIndex={0} role="region" aria-label="Users, scrollable">
        <Table
          aria-label="Users"
          size="small"
          sx={{
            // Below this the columns squeeze until the text wraps, which makes rows
            // taller than the loading skeleton and moves everything under the table.
            minWidth: 640,
            // Every row is exactly one line, so a wrapped cell cannot make its row taller
            // than the skeleton and shift the layout when the data arrives.
            '& th, & td': { whiteSpace: 'nowrap' },
            // Dimmed rather than replaced, so the table does not flash empty between
            // queries and the layout does not jump.
            opacity: isRefreshing ? 0.5 : 1,
            transition: 'opacity 150ms',
          }}
        >
          <TableHead>
            <TableRow>
              {USERS_COLUMNS.map((column) => {
                const isSortable = column.id === SORTABLE_COLUMN_ID;

                return (
                  // `sortDirection` is what puts aria-sort on the header, which is how a
                  // screen reader is told the column is sorted and which way.
                  <TableCell
                    key={column.id}
                    sortDirection={isSortable ? query.sort : false}
                    sx={{ width: column.width }}
                  >
                    {isSortable ? (
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
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {state.status === 'loading' &&
              Array.from({ length: query.pageSize }, (_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {USERS_COLUMNS.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {state.status === 'ready' &&
              state.users.map((user) => <UsersTableRow key={user.id} user={user} />)}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Outside the scroll container on purpose. Inside it the message would be centred
          across the table's minimum width and sit off screen on a phone. */}
      {state.status === 'empty' && (
        <StatusBlock
          title="No users yet"
          description="Nobody has been added. When they are, they will appear here."
        />
      )}

      {state.status === 'no-results' && (
        <StatusBlock
          title="No users match these filters"
          description="Try a different search term, or clear the filters to see everyone."
          action={<Button onClick={onClearFilters}>Clear filters</Button>}
        />
      )}

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

/** Sorting reorders rows silently for anyone who is not looking at the screen. */
function announce(state: UsersTableState, query: UsersQuery): string {
  switch (state.status) {
    case 'loading':
      return 'Loading users';
    case 'empty':
      return 'No users';
    case 'no-results':
      return 'No users match these filters';
    case 'ready': {
      const direction = query.sort === 'asc' ? 'ascending' : 'descending';
      const noun = state.total === 1 ? 'user' : 'users';
      // Grouped, because "100000 users" is read out as a digit stream.
      return `${state.total.toLocaleString()} ${noun}, sorted by name, ${direction}`;
    }
  }
}
