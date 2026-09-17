import { useQuery } from '@tanstack/react-query';
import { listCities } from './usersApi';
import { usersKeys } from './usersKeys';

/**
 * Not keyed by the query. The cities the filter can offer do not depend on what is
 * currently filtered, and keying it by the query would empty the dropdown as soon as
 * somebody used it.
 */
export function useCitiesQuery() {
  return useQuery({
    queryKey: usersKeys.cities(),
    queryFn: ({ signal }) => listCities(signal),
  });
}
