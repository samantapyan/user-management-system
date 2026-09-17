import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { applyEdit, findEdit } from '../model/applyEdits';
import type { User } from '../model/types';
import { useUserEdits } from '../model/userEdits';
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
  const edit = findEdit(useUserEdits(), id);

  /* The local rename goes on after the cache rather than inside the key, so renaming does
     not throw away a user this query already holds. Memoised on the edit, because an
     unstable `select` re-runs on every render. */
  const withLocalName = useCallback(
    (user: User | null) => (user === null ? null : applyEdit(user, edit)),
    [edit],
  );

  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: ({ signal }) => getUser(id, signal),
    select: withLocalName,
    ...(placeholder === undefined ? {} : { placeholderData: placeholder }),
  });
}
