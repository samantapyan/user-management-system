import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { errorMessage, isRetryable } from '@/shared/lib/http';
import { StatusBlock } from '@/shared/ui/StatusBlock';
import { useCitiesQuery } from '../api/useCitiesQuery';
import { useUsersQuery } from '../api/useUsersQuery';
import { useUsersParams } from '../model/useUsersParams';
import { DEFAULT_QUERY, isFiltered } from '../model/usersParams';
import { UsersFilters } from './UsersFilters';
import { UsersTable } from './UsersTable';

/**
 * Owns the URL and the query, and is the only component in the feature that does.
 * Everything below it is handed data and reports changes back, which is what keeps those
 * components renderable in a test with no router and no network.
 */
export function UsersScreen() {
  const { query, setQuery } = useUsersParams();
  const usersQuery = useUsersQuery(query);
  const citiesQuery = useCitiesQuery();

  const clearFilters = () => {
    setQuery({ search: DEFAULT_QUERY.search, city: null });
  };

  return (
    <>
      {/* Rendered whether or not the list loaded. A failure that takes the search box
          away with it leaves the user unable to change the thing that failed, and the
          term is still in the URL, so the app knows it and would be showing nothing. */}
      <UsersFilters
        query={query}
        cities={citiesQuery.data ?? []}
        citiesFailed={citiesQuery.isError}
        onQueryChange={setQuery}
      />

      {usersQuery.isError ? (
        <Paper variant="outlined">
          <StatusBlock
            title="Could not load users"
            description={errorMessage(usersQuery.error)}
            action={
              // A malformed response will be malformed again, so offering a retry there
              // is offering a button that does nothing.
              isRetryable(usersQuery.error) ? (
                <Button variant="contained" onClick={() => void usersQuery.refetch()}>
                  Try again
                </Button>
              ) : undefined
            }
          />
        </Paper>
      ) : (
        <UsersTable
          users={usersQuery.data?.items ?? []}
          total={usersQuery.data?.total ?? 0}
          query={query}
          onQueryChange={setQuery}
          isLoading={usersQuery.isPending}
          isStale={usersQuery.isPlaceholderData}
          emptyState={
            // Two situations that look identical in a table. Only one has a way out, and
            // offering "clear filters" when nothing is filtered is worse than offering
            // nothing.
            isFiltered(query) ? (
              <StatusBlock
                title="No users match these filters"
                description="Try a different search term, or clear the filters to see everyone."
                action={<Button onClick={clearFilters}>Clear filters</Button>}
              />
            ) : (
              <StatusBlock
                title="No users yet"
                description="Nobody has been added. When they are, they will appear here."
              />
            )
          }
        />
      )}
    </>
  );
}
