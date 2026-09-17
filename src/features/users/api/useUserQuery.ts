import { useQuery } from '@tanstack/react-query';
import { findEdit } from '../model/applyEdits';
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

  return useQuery({
    queryKey: usersKeys.detail(id, edit),
    queryFn: ({ signal }) => getUser(id, edit, signal),
    ...(placeholder === undefined ? {} : { placeholderData: placeholder }),
  });
}
