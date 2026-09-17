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
 * Horizontal only. MUI's default is `overflow: auto`, which makes this a scroll container
 * on both axes: a second vertical scroller inside the page's own, for a box whose height
 * is always exactly its content. `hidden` on the vertical axis is what CSS requires here,
 * because an axis set to `visible` next to a scrolling one is computed back to `auto`.
 */
const tableContainerSx = {
  overflowX: 'auto',
  overflowY: 'hidden',
  /**
   * Makes this the containing block for the visually hidden "Actions" label in the last
   * header cell. That label is `position: absolute` with no positioned ancestor, so its
   * containing block was the page itself and the scroller did not clip it: the document
   * grew to reach its static position at 610px and the page got a horizontal scrollbar
   * of its own on a phone, next to the table's. Everything else stayed inside the card,
   * which is why only the scrollbar showed.
   */
  position: 'relative',
} as const;
const pageSizes = [...PAGE_SIZE_OPTIONS];

/**
 * The toolbar is laid out for a full-width table and does not fit a phone in one line, so
 * it wraps rather than being clipped by the card. The spacer defaults to a 100% basis,
 * which on its own would put every control on its own line.
 */
const paginationSx = {
  // Same reason as the table container: MUI makes this a scroll container on both axes.
  // It wraps now, so it never needs to scroll on either.
  overflow: 'hidden',
  '& .MuiTablePagination-toolbar': {
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    rowGap: 1,
    py: 1,
    // MUI pads this 16px on the left and 2px on the right, which left "1–10 of 10"
    // against the card border with the page buttons below it. Even gutters instead, the
    // same 16px the table's own cells use, so the two line up down the card.
    px: 2,
  },
  '& .MuiTablePagination-spacer': { flex: '1 1 auto' },
  /*
   * MUI reserves 32px after the page size and 20px before the buttons. That is spacing
   * for a table the width of a desktop window, and on a phone it was the difference
   * between one line and two: at 399px the row needed all 365px it had, so the buttons
   * wrapped and the card grew by 52px for a row holding two arrows. Half the spacing
   * reads the same and gives back 28px.
   */
  '& .MuiTablePagination-input': { mr: 2 },
  '& .MuiTablePagination-actions': { ml: 1 },
} as const;

/**
 * "Rows per page:" is 94px of the 341px a 375px phone gives this toolbar, which on its
 * own is enough to push the page buttons onto a second row. The words explain the number
 * beside them and the number is still there, so they are dropped where the line cannot
 * afford them. A media query rather than a breakpoint hook, so the label is right on the
 * first paint instead of after one.
 *
 * 420px is where the full label fits again, with room left over for a longer count than
 * this dataset's "1-10 of 10".
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
            // Fixed, so the percentage widths on the headers are obeyed and the table is
            // exactly as wide as its container. Left on auto it sizes to its longest cell,
            // which put it at 752px whatever the window was doing and left the scrollbar
            // showing at widths it had no reason to appear at.
            tableLayout: 'fixed',
            // Below this the columns are too narrow to read, so the container scrolls
            // sideways instead of squeezing them further. This is the only scrollbar the
            // page is meant to have besides its own.
            minWidth: 640,
            // One line per cell, clipped if it does not fit. A wrapped cell would be
            // taller than its skeleton and shift everything under the table when the data
            // arrives. The detail view has the full value.
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
                    ) : column.kind === 'actions' ? (
                      // Every column needs a name for a screen reader, but a column of
                      // buttons does not need a visible heading.
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
