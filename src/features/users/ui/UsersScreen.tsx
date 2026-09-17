import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { StatusBlock } from '@/shared/ui/StatusBlock';
import { useCitiesQuery } from '../api/useCitiesQuery';
import { useUsersQuery } from '../api/useUsersQuery';
import { useUsersParams } from '../model/useUsersParams';
import { DEFAULT_QUERY } from '../model/usersParams';
import { resolveUsersViewState } from '../model/usersViewState';
import { UsersFilters } from './UsersFilters';
import { UsersTable } from './UsersTable';

/** One array, not a new one per render, so the memo on the filters survives the wait. */
const NO_CITIES: string[] = [];

/**
 * Owns the URL and the query, and is the only component in the feature that does.
 * Everything below it is handed data and reports changes back, which is what keeps those
 * components renderable in a test with no router and no network.
 */
export function UsersScreen() {
  const { query, setQuery } = useUsersParams();
  const usersQuery = useUsersQuery(query);
  const citiesQuery = useCitiesQuery();

  const state = resolveUsersViewState(usersQuery, query);
  const retry = () => void usersQuery.refetch();
  const clearFilters = () => setQuery({ search: DEFAULT_QUERY.search, city: null });

  return (
    <>
      {/* Rendered whether or not the list loaded. A failure that takes the search box
          away with it leaves the user unable to change the thing that failed, while the
          term is still in the URL, so the app knows it and would be showing nothing. */}
      <UsersFilters
        search={query.search}
        city={query.city}
        cities={citiesQuery.data ?? NO_CITIES}
        citiesFailed={citiesQuery.isError}
        onQueryChange={setQuery}
      />

      {state.status === 'error' ? (
        <Paper variant="outlined">
          <StatusBlock
            title="Could not load users"
            description={state.message}
            action={
              state.canRetry ? (
                <Button variant="contained" onClick={retry}>
                  Try again
                </Button>
              ) : undefined
            }
          />
        </Paper>
      ) : (
        <UsersTable
          state={state}
          query={query}
          onQueryChange={setQuery}
          onClearFilters={clearFilters}
          onRetry={retry}
        />
      )}
    </>
  );
}
