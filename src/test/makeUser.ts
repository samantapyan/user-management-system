import type { User } from '@/features/users/model/types';

/**
 * A user with every field filled in, so a test only names the fields it is about. The
 * defaults are unique per id, so a test fails because the code is wrong rather than
 * because two fixtures shared a value.
 */

type UserOverrides = Partial<Omit<User, 'address'>> & {
  address?: Partial<User['address']>;
};

export function makeUser(id: number, overrides: UserOverrides = {}): User {
  const { address, ...rest } = overrides;

  return {
    id,
    name: `User ${id}`,
    username: `user${id}`,
    email: `user${id}@example.com`,
    phone: `555-000-${id}`,
    website: `user${id}.example.com`,
    company: `Company ${id}`,
    ...rest,
    address: {
      street: `Street ${id}`,
      suite: `Suite ${id}`,
      city: `City ${id}`,
      zipcode: `1000${id}`,
      ...address,
    },
  };
}

/** Shorthand for the assertions that only care about which rows came back, in order. */
export function namesOf(users: readonly User[]): string[] {
  return users.map((user) => user.name);
}

export function idsOf(users: readonly User[]): number[] {
  return users.map((user) => user.id);
}
