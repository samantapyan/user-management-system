/**
 * The public surface of the users feature.
 *
 * Nothing outside this folder imports from anywhere inside it. That is what
 * makes everything below this line free to be renamed, split or moved without a
 * single edit outside the feature, and it is what stops the next feature from
 * reaching into this one's internals because it was convenient once.
 *
 * If something here should not be exported, it should not be in this file.
 */

export { usersKeys, useUsersQuery } from './api/useUsersQuery';
export type {
  SortDirection,
  User,
  UserAddress,
  UsersQuery,
  UsersResponse,
} from './model/types';
