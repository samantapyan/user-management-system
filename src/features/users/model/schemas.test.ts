import { describe, expect, it } from 'vitest';
import { userEditFormSchema, userEditsSchema, usersResponseSchema } from './schemas';

/** The two edges data crosses into the app: the API, and localStorage. */

const apiUser = {
  id: 1,
  name: 'Leanne Graham',
  username: 'Bret',
  email: 'Sincere@april.biz',
  phone: '1-770-736-8031 x56442',
  website: 'hildegard.org',
  address: {
    street: 'Kulas Light',
    suite: 'Apt. 556',
    city: 'Gwenborough',
    zipcode: '92998-3874',
    geo: { lat: '-37.3159', lng: '81.1496' },
  },
  company: {
    name: 'Romaguera-Crona',
    catchPhrase: 'Multi-layered client-server neural-net',
    bs: 'harness real-time e-markets',
  },
};

describe('usersResponseSchema', () => {
  it('keeps what the app uses and drops the rest, without being fussy about it', () => {
    const [user] = usersResponseSchema.parse([apiUser]);

    // Letting `geo`, `catchPhrase` and `bs` in means something depends on them by
    // accident, and the day the API drops one is an incident instead of a shrug.
    expect(user?.company).toBe('Romaguera-Crona');
    expect(user?.address).not.toHaveProperty('geo');

    // A field added yesterday is no reason for an error page, and one malformed address
    // is no reason to hide a row. A user nobody can see is worse than a wrong email.
    expect(usersResponseSchema.safeParse([{ ...apiUser, nickname: 'Lee' }]).success).toBe(
      true,
    );
    expect(usersResponseSchema.safeParse([{ ...apiUser, email: 'nope' }]).success).toBe(
      true,
    );

    // What it will not do is invent an id, because everything downstream keys off it.
    expect(usersResponseSchema.safeParse([{ ...apiUser, id: '1' }]).success).toBe(false);
  });
});

describe('the rename rules', () => {
  it('guards the name on the way in and on the way back out', () => {
    const saved = userEditFormSchema.parse({ name: '  Leanne Graham  ' });
    const restored = userEditsSchema.parse({ '1': { name: 'Renamed', id: 999 } });

    // Trimmed by the schema, not the submit handler, so what was validated is what gets
    // saved. The other way round, three spaces pass a two character minimum.
    expect(saved.name).toBe('Leanne Graham');
    expect(userEditFormSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(userEditFormSchema.safeParse({ name: ' a ' }).success).toBe(false);
    expect(userEditFormSchema.safeParse({ name: 'a'.repeat(61) }).success).toBe(false);
    expect(userEditFormSchema.safeParse({ name: 'a'.repeat(60) }).success).toBe(true);

    // Storage is editable by hand and the edit is spread over the user, so a stored `id`
    // would replace the row's own and let devtools decide which user is which.
    expect(restored['1']).toEqual({ name: 'Renamed' });
  });
});
