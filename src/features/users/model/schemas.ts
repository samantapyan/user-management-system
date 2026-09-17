import { z } from 'zod';
import type { User, UserEdits } from './types';

const apiUserSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  username: z.string(),
  // Not z.email(). A malformed address would reject the record and hide the whole row.
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
 * Unknown keys are dropped, not rejected. That is what keeps `address.geo`,
 * `company.catchPhrase` and `company.bs` out of the app, and what stops a new field on
 * the API from breaking it.
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

/**
 * What may be read back out of `localStorage`.
 *
 * Deliberately loose about the name: a value that fails today's form rules can still have
 * been written by an older build, and refusing to read it would lose every other edit
 * stored alongside it. The form validates what goes in; this only guarantees the shape.
 */
export const userEditsSchema: z.ZodType<UserEdits> = z.record(
  z.string(),
  z.object({ name: z.string() }),
);

/**
 * The rename form. Nothing in the brief says what a name may be, so: trimmed, required,
 * two to sixty characters, duplicates allowed.
 *
 * Trimmed by the schema rather than by the submit handler, so the value that is validated
 * is the value that is saved. Validating the untrimmed string would accept a name of
 * three spaces.
 */
export const userEditFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name needs at least 2 characters.')
    .max(60, 'Name cannot be longer than 60 characters.'),
});

export type UserEditFormValues = z.infer<typeof userEditFormSchema>;
