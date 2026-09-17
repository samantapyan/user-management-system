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
import Box from '@mui/material/Box';
import { visuallyHidden } from '@mui/utils';
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
  onOpenUser: (id: number) => void;
};

const paperSx = { overflow: 'hidden' } as const;

/**
 * Horizontal only. `hidden` and not `visible` on the other axis, because CSS computes
 * `visible` back to `auto` beside a scrolling one, adding a second vertical scroller.
 */
const tableContainerSx = {
  overflowX: 'auto',
  overflowY: 'hidden',
  // The containing block for the visually hidden "Actions" label. Without it, that label
  // is positioned against the page, which then grows to reach it and gains a scrollbar.
  position: 'relative',
} as const;
const pageSizes = [...PAGE_SIZE_OPTIONS];

/** Wraps rather than being clipped on a phone. The spacer's default 100% basis would
 * otherwise put every control on its own line. */
const paginationSx = {
  // It wraps, so it never needs to scroll on either axis.
  overflow: 'hidden',
  '& .MuiTablePagination-toolbar': {
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    rowGap: 1,
    py: 1,
    // Even gutters, the same 16px the cells use, so the two line up down the card.
    px: 2,
  },
  '& .MuiTablePagination-spacer': { flex: '1 1 auto' },
  // Half of MUI's spacing, which is sized for a desktop window. It reads the same and is
  // the difference between one line and two on a phone.
  '& .MuiTablePagination-input': { mr: 2 },
  '& .MuiTablePagination-actions': { ml: 1 },
} as const;

/**
 * "Rows per page:" costs 94px a phone does not have, and the number beside it says the
 * same thing. A media query, not a breakpoint hook, so it is right on the first paint.
 */
const perPageSx = {
  display: 'none',
  '@media (min-width: 420px)': { display: 'inline' },
} as const;

const labelRowsPerPage = (
  <>
    Rows
    <Box component="span" sx={perPageSx}>
      {' per page'}
    </Box>
    :
  </>
);

export function UsersTable({
  state,
  query,
  onQueryChange,
  onClearFilters,
  onRetry,
  onOpenUser,
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
      <TableContainer
        tabIndex={0}
        role="region"
        aria-label="Users, scrollable"
        sx={tableContainerSx}
      >
        <Table
          aria-label="Users"
          size="small"
          sx={{
            // So the header percentages are obeyed. On auto the table sizes to its
            // longest cell and scrolls at widths it has no reason to.
            tableLayout: 'fixed',
            // Below this the columns are unreadable, so the container scrolls instead.
            minWidth: 640,
            // One line per cell. A wrapped cell is taller than its skeleton and shifts
            // the page when data arrives. The detail view has the full value.
            '& th, & td': {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
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
                  // `sortDirection` is what puts aria-sort on the header.
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
                    ) : column.kind === 'actions' ? (
                      // Named for a screen reader, without a visible heading.
                      <Box component="span" sx={visuallyHidden}>
                        {column.label}
                      </Box>
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
              state.users.map((user) => (
                <UsersTableRow
                  key={user.id}
                  user={user}
                  isEdited={state.editedIds.includes(user.id)}
                  onOpen={onOpenUser}
                />
              ))}
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
        sx={paginationSx}
        labelRowsPerPage={labelRowsPerPage}
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
