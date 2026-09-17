import { z } from 'zod';
import type { User } from './types';

/**
 * What the API actually sends, and how it becomes a `User`.
 *
 * Validating a response the app did not produce is not ceremony. The fixture
 * returns ten well formed users today, but the code is written for an API that
 * can change under it, and the difference between a schema failure and no
 * schema is a clear error state against `undefined is not an object` three
 * components deeper.
 */

const apiUserSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  username: z.string(),
  /* Not `z.email()`. A user whose address is malformed is still a user, and
     rejecting the record would hide the whole row rather than one field. This
     is display data, not something being sent anywhere. */
  email: z.string(),
  phone: z.string(),
  website: z.string(),
  address: z.object({
    street: z.string(),
    suite: z.string(),
    city: z.string(),
    zipcode: z.string(),
  }),
  company: z.object({ name: z.string() }),
});

/**
 * Unknown keys are dropped rather than rejected, which is zod's default and the
 * right one here. The response also carries `address.geo`, `company.catchPhrase`
 * and `company.bs`. Nothing needs them, so they never enter the application.
 * Rejecting on extra keys would also mean the app breaks the day the API adds a
 * field, which is the opposite of what validation is for.
 */
export const usersResponseSchema = z
  .array(apiUserSchema)
  .transform((rows): User[] => rows.map(toUser));

function toUser(raw: z.infer<typeof apiUserSchema>): User {
  return {
    id: raw.id,
    name: raw.name,
    username: raw.username,
    email: raw.email,
    phone: raw.phone,
    website: raw.website,
    company: raw.company.name,
    address: {
      street: raw.address.street,
      suite: raw.address.suite,
      city: raw.address.city,
      zipcode: raw.address.zipcode,
    },
  };
}
