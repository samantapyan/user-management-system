import { useCallback, useMemo } from 'react';
import { useUrlParams } from '@/shared/lib/useUrlParams';
import { parseOpenUserId, withOpenUser } from './openUserParam';

export function useOpenUser() {
  const [params, setParams] = useUrlParams();

  const openUserId = useMemo(() => parseOpenUserId(params), [params]);

  /* Opening pushes, so back closes the dialog, which is what the back button is for here.
     Closing replaces, because the entry the opening created has done its job and pushing
     a second one would mean two presses of back to leave a dialog already shut. */
  const openUser = useCallback(
    (id: number) => {
      setParams((current) => withOpenUser(current, id), { replace: false });
    },
    [setParams],
  );

  const closeUser = useCallback(() => {
    setParams((current) => withOpenUser(current, null), { replace: true });
  }, [setParams]);

  return { openUserId, openUser, closeUser };
}
