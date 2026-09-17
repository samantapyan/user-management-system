import Button from '@mui/material/Button';
import { errorMessage, isRetryable } from '@/shared/lib/http';
import { StatusBlock } from '@/shared/ui/StatusBlock';
import { useUsersQuery } from '../api/useUsersQuery';
import { useUsersParams } from '../model/useUsersParams';
import { DEFAULT_QUERY, isFiltered } from '../model/usersParams';
import { UsersTable } from './UsersTable';

/**
 * Owns the URL and the query, and is the only component in the feature that does.
 * Everything below it is handed data and reports changes back, which is what keeps those
 * components renderable in a test with no router and no network.
 */
export function UsersScreen() {
  const { query, setQuery } = useUsersParams();
  const usersQuery = useUsersQuery(query);

  if (usersQuery.isError) {
    return (
      <StatusBlock
        title="Could not load users"
        description={errorMessage(usersQuery.error)}
        action={
          isRetryable(usersQuery.error) ? (
            <Button variant="contained" onClick={() => void usersQuery.refetch()}>
              Try again
            </Button>
          ) : undefined
        }
      />
    );
  }

  const filtered = isFiltered(query);

  return (
    <UsersTable
      users={usersQuery.data?.items ?? []}
      total={usersQuery.data?.total ?? 0}
      query={query}
      onQueryChange={setQuery}
      isLoading={usersQuery.isPending}
      isStale={usersQuery.isPlaceholderData}
      emptyState={
        // Two different situations that look identical in a table. Only one of them has
        // a way out, and offering "clear filters" when nothing is filtered is worse than
        // offering nothing.
        filtered ? (
          <StatusBlock
            title="No users match these filters"
            description="Try a different search term, or clear the filters to see everyone."
            action={
              <Button
                onClick={() => setQuery({ search: DEFAULT_QUERY.search, city: null })}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <StatusBlock
            title="No users yet"
            description="Nobody has been added. When they are, they will appear here."
          />
        )
      }
    />
  );
}
