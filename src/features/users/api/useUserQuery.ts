import { useQuery } from '@tanstack/react-query';
import type { User } from '../model/types';
import { getUser } from './usersApi';
import { usersKeys } from './usersKeys';

/**
 * `placeholder` is the row the user clicked, when they clicked one.
 *
 * It is a placeholder rather than initialData on purpose: it shows the detail instantly
 * instead of a spinner over data already on screen, while the request still runs and the
 * cache is never seeded with a value this query did not fetch. Arriving on a shared link
 * there is no row, so there is no placeholder and the dialog loads normally.
 */
export function useUserQuery(id: number, placeholder: User | undefined) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: ({ signal }) => getUser(id, signal),
    ...(placeholder === undefined ? {} : { placeholderData: placeholder }),
  });
}
