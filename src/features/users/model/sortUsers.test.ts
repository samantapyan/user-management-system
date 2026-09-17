import { describe, expect, it } from 'vitest';
import { makeUser, namesOf } from '@/test/makeUser';
import { compareUsersByName } from './sortUsers';

describe('compareUsersByName', () => {
  it("sorts by the reader's locale rather than by code point", () => {
    const users = [
      makeUser(1, { name: 'Zoe' }),
      makeUser(2, { name: 'Ärger' }),
      makeUser(3, { name: 'Anna' }),
      makeUser(4, { name: 'User 10' }),
      makeUser(5, { name: 'User 2' }),
    ];

    const sorted = [...users].sort((a, b) => compareUsersByName(a, b, 'asc'));

    /* `<` is the obvious simplification and wrong twice over: accented letters file after
       Z, and "User 10" comes before "User 2". The accent half assumes a locale that files
       Ä with A, which is every Latin one but the Nordic languages. */
    expect(namesOf(sorted)).toEqual(['Anna', 'Ärger', 'User 2', 'User 10', 'Zoe']);
  });
});
