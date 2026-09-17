import type { User } from '../model/types';

/**
 * The detail fields, defined once, for the same reason as the table columns: labels in
 * one place and values in another is two lists that drift. The name is the dialog title,
 * so it is not here. `href` is the only rendering decision carried.
 */
type UserDetailField = {
  id: string;
  label: string;
  value: (user: User) => string;
  href?: (user: User) => string;
  /** Leaves the app, so it opens in a new tab. */
  external?: boolean;
};

export const USER_DETAIL_FIELDS: readonly UserDetailField[] = [
  { id: 'username', label: 'Username', value: (user) => user.username },
  {
    id: 'email',
    label: 'Email',
    value: (user) => user.email,
    href: (user) => `mailto:${user.email}`,
  },
  {
    id: 'phone',
    label: 'Phone',
    value: (user) => user.phone,
    /* The extension is dropped rather than concatenated. "1-770-736-8031 x56442"
       stripped of punctuation becomes 1770736803156442, which is not a number that
       dials. */
    href: (user) => `tel:${(user.phone.split('x')[0] ?? '').replace(/[^\d+]/g, '')}`,
  },
  {
    id: 'website',
    label: 'Website',
    value: (user) => user.website,
    href: (user) => `https://${user.website}`,
    external: true,
  },
  { id: 'company', label: 'Company', value: (user) => user.company },
  {
    id: 'address',
    label: 'Address',
    value: (user) =>
      `${user.address.suite}, ${user.address.street}, ${user.address.city} ${user.address.zipcode}`,
  },
];
