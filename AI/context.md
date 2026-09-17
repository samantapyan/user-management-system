# Working in this repo

The brief for anyone about to change code in this repo. It is written to be used, not
read. If you read only two sections, read "Rules that are not negotiable" and "Traps
this codebase has already sprung".

It describes the shape the code is being built into, so where something does not exist
yet, it says so.

## What this is

A single screen that lists users from `https://jsonplaceholder.typicode.com/users`, with
search, sorting, a city filter, a detail view, and the ability to rename a user so the
change survives a reload.

It is deliberately not a large application. There is no backend, no authentication, no
router beyond what this one screen needs, and no design system. If a change you are asked
to make seems to need one of those, you have misread the task. Say so rather than
building it.

The API is a fixture. It returns ten users instantly and never fails. Real APIs do
neither, so the code is written for an API that is slow, that fails, and that has far more
than ten rows, even though this one is none of those things. Do not simplify code on the
grounds that the API always works. That is the point of the code.

## Before you change anything

```bash
npm install
npm run dev        # http://localhost:5173
```

To check your work:

```bash
npm run verify     # typecheck, lint, format check, then the tests
npm test           # the tests on their own
npm run build      # tsc -b && vite build
```

**The dev server does not typecheck.** Vite strips TypeScript types with esbuild and never
looks at them, so the page can render perfectly while the code does not compile. "It runs"
is not evidence. Run `npm run verify` before you say you are finished, and check the exit
code rather than reading the output.

`npm run build` is the second check, because development and production do not use the
same pipeline. Development is esbuild plus native modules, production is Rollup. Something
can work in one and not the other.

If you changed anything that renders, measure it:

```bash
npm run build && npm run preview
npx lighthouse http://localhost:4173 --view
```

Against the preview build, never the dev server. The dev server serves unbundled,
unminified modules and scores around 64 for performance, which measures Vite rather than
this app. That number has already fooled somebody once.

A green Lighthouse is a floor, not a pass. It reported accessibility 100 while the sort
header had no visible focus ring at all, because it cannot tell whether a focus style is
actually visible. Tab through the screen yourself and look at where focus lands.

**There is a test suite: `npm test`, or `npm run test:watch`.** Twenty tests, nine files,
Vitest, and `npm run verify` runs them last.

Tests sit beside the module they cover, as `queryUsers.test.ts` next to `queryUsers.ts`,
not in a `__tests__` folder. Shared fixtures and fakes are in `src/test/`: `makeUser` builds
a user with every field filled in, and `installFakeLocalStorage` hands you a `localStorage`
you can tell to refuse a read, refuse a write, or deny access to the store outright.

**There is no DOM.** The environment is `node`, with no jsdom and no React Testing Library.
The only browser API this app touches is `localStorage`, and the fake covers it. Needing a
DOM means you are testing a component, which is the paragraph after next.

**If you change `model/` or `api/`, the test comes with the change, in the same commit.**
Both layers are free of React and of the DOM precisely so that this costs you nothing.

**The bar for a new test is that it names a bug it would catch**, in a comment above the
assertion, and the name of the test says the behaviour rather than the function. If you
cannot name the bug, do not write the test. Then prove it: break the code it covers on
purpose, watch it fail, and put the code back. A test that passes either way is worse than
no test, because it reports green while checking nothing. Every test here was checked that
way, against nineteen deliberate breakages.

Do not write a test that mounts a component and asserts it mounted, a snapshot, a test that
mocks everything and then asserts the mocks were called, or a test added to move a coverage
number. Twenty tests that each name a bug beat two hundred that execute lines.

**Nothing that renders is tested, and adding the first one is a decision, not a chore.** It
means React Testing Library, a DOM environment and a router in the test. If the work you
are doing genuinely needs it, say so in the commit rather than quietly adding three
dependencies. The known gap is the guard on an unsaved rename.

Vitest is pinned to 3.x. Version 4 needs Node 20.19 and this is built on 20.9.

For accessibility, a score is not a check. Load axe-core against the running preview and
run it in every state your change can reach, not only the first paint:

```js
const src = await fetch(
  'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js',
).then((r) => r.text());
document.head.appendChild(
  Object.assign(document.createElement('script'), { textContent: src }),
);
await axe.run(document, {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
});
```

That currently reports zero violations across the list, the dialog, the edit form and the
form in its invalid state. Read its `incomplete` results as well and settle them by hand:
both of the ones reported here are false positives, and proving that took measuring the
contrast manually and tabbing to confirm the dialog traps focus.

**Finished means all of these, not the first one.** `npm run verify` exits 0, which
includes the tests. `npm run build` exits 0. Logic you changed in `model/` or `api/` has a
test that fails without your change. The behaviour you changed is exercised in a browser.
Nothing that used to work has stopped.

**Measure, do not estimate.** Every number in the README was measured: bundle size before
and after a dependency, requests per action, layout shift compared against the build from
before the change. One of them stayed wrong until it was measured a second time.

## Where code lives

```
AI/
  context.md            this file
src/
  app/                  what boots the application
    App.tsx             the screen shell: top bar, centred content
    providers.tsx       every provider in one place
    queryClient.ts      cache, retry and staleness policy
    router.tsx          the route table
    RouteError.tsx      the last line of defence when a render throws
    theme.ts            the MUI theme
  features/
    users/              the whole product, one folder
      api/              everything that talks to the network
      constants/        values the feature is configured by, not logic
      model/            logic with no JSX. Most of the tests point here
        hooks/          the React bindings over it, which a test cannot reach
      ui/               components
      index.ts          the only file the outside may import
  shared/
    config.ts           anything that changes between environments
    ui/                 components more than one feature would need
    lib/                helpers more than one feature would need
  test/                 fixtures and fakes the tests share, no tests of its own
```

Every `*.test.ts` sits beside the module it covers, so the tree above is also the map of
where a test goes.

The files you are most likely to need, and what each one owns:

| File                            | Owns                                                              |
| ------------------------------- | ----------------------------------------------------------------- |
| `api/usersApi.ts`               | the only place the query work and the edit overlay are applied    |
| `api/usersKeys.ts`              | every cache key, built from one root                              |
| `model/queryUsers.ts`           | search, city filter, sort, paging: the work a server would do     |
| `model/applyEdits.ts`           | merging local renames, and the order that has to happen in        |
| `model/userEdits.ts`            | the rename store, `localStorage` backed                           |
| `model/usersParams.ts`          | URL to typed query and back                                       |
| `model/hooks/useUsersParams.ts` | which changes get a history entry                                 |
| `model/usersViewState.ts`       | which one state the screen is in                                  |
| `model/schemas.ts`              | every zod schema: the API shape, the stored edits, the form rules |
| `constants/usersColumns.ts`     | the table's columns, declared once                                |
| `shared/lib/http.ts`            | the only `fetch`, with the timeout and the error normalising      |
| `shared/lib/storage.ts`         | versioned, validated `localStorage`                               |

**Grouped by feature, not by file type.** A top level `components/`, `hooks/`, `utils/`
works for five files and stops working somewhere around thirty screens, because from then
on one change touches four folders every time. With `features/users/` everything about
users is in one place, and a second feature is a new sibling folder rather than edits
spread across the tree.

**How to decide where a new file goes.** Ask who needs it. If only the users screen needs
it, it goes in `features/users`. If a second feature would need it, it goes in `shared`. If
it boots or configures the app, it goes in `app`. If you cannot answer the question, the
file is probably doing two things.

## Rules that are not negotiable

**1. Imports only flow one way.** A feature may import from `shared`. `shared` may never
import from a feature. Two features may never import each other. If two features need the
same thing, it moves to `shared`. This is one sentence, and it is the only thing standing
between this app and a graph where everything depends on everything.

**2. A feature is entered through its `index.ts`.** Nothing outside `features/users/` may
reach inside it. Import from `features/users`, never from
`features/users/ui/UsersTable`. Everything inside the feature can then be renamed, split or
moved without touching a file outside it.

The one exception is `src/test/makeUser.ts`, which imports the `User` type from
`features/users/model/types`. It is `import type`, so it erases at compile time and adds no
edge to the module graph, and the alternative was widening the feature's public surface for
a fixture. If you need a value rather than a type from inside a feature, that exception does
not stretch to cover you.

**3. The network is touched in `features/*/api` and nowhere else.** No `fetch` in a
component, in a hook outside `api/`, or in `model/`. The abort signal and the error
handling live there too. If a component knows a URL, the layering has already broken.

**4. `model/` holds logic with no JSX.** The storage overlay, the URL to query mapping, the
schemas, the sort comparator. It is testable precisely because it does not need a rendered
component, so a file whose whole job is calling hooks belongs in `model/hooks/` instead.
`userEdits.ts` stays put because it is a store that happens to expose one hook, and moving
it would describe it wrongly. When you are about to put logic inside a component, check
whether it belongs here first.

**5. Two levels inside a feature at most, and no folder holding a single file.** If you
need a third level, the feature probably wants splitting in two. A folder with one file in
it is structure for its own sake.

**6. Do not export something until a file outside this one imports it.** An export is a
commitment that the symbol can no longer be renamed or reshaped without checking who
depends on it. Adding the keyword later costs one keystroke. If a helper can only be
tested by exporting it, test it through whatever does use it instead, or give it its own
module with a real surface. `index.ts` is the same rule one level up.

**7. The table's columns are defined once, in `constants/usersColumns.ts`.** The header,
the body and the loading skeleton all read that array, so adding a column is one entry
there. If you find yourself editing the header, the row component and a skeleton to add one
column, stop: that is the bug this rule exists to prevent, and a mismatch between them only
shows while data is loading, which is when nobody is looking.

Two things come with that entry. The widths are binding, because the table is
`table-layout: fixed`: the four data columns are percentages that currently come to 90 and
the actions column is a fixed `64px`, so a new column means rebalancing the rest rather
than appending a width and hoping. And `value` returns a string on purpose, because a
config that can render arbitrary elements stops being configuration and becomes a
framework; if one column genuinely needs a link or a chip, give the type an optional
`render` for that column rather than turning every column into JSX.

Sorting is the exception to "one entry". `UsersQuery` carries a direction and no field, so
exactly one column can be sortable and it is named by `SORTABLE_COLUMN_ID`. Making a second
column sortable means adding `sortBy` to `UsersQuery` first.

## Code conventions

**TypeScript is strict and the flags are deliberate.** On top of `strict`:
`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
`noImplicitReturns`, `noPropertyAccessFromIndexSignature`. They are on from the first
commit because turning them on later means fixing every error at once, by which point the
workarounds are already written.

**Do not loosen them to make an error go away.** If `noUncheckedIndexedAccess` says
`users[0]` might be undefined, it is right, so handle it. Editing `tsconfig` to silence a
compiler that is correct is the worst change you can make in this repo.

`any` and non-null assertions are ESLint errors, not warnings. So is an unused variable,
unless it starts with an underscore. If you genuinely need an escape hatch, use
`@ts-expect-error` with a sentence above it saying why, so the next person can judge it.

**`exactOptionalPropertyTypes` changes how an optional prop is passed.** `{ cause: undefined }`
is not the same as passing nothing, so an optional value is spread in rather than set to
undefined: `...(placeholder === undefined ? {} : { placeholderData: placeholder })`. You
will meet this the first time you forward something optional, in `useUserQuery` and in
`shared/lib/http.ts`.

**Comments are rare and load bearing.** Keep one only if deleting it would let a competent
developer confidently make a wrong change: a trap, a constraint that is not visible in the
code, or a line that looks wrong and is right. Why a library or an approach was chosen goes
in the README, not above the code. If a file is more than roughly fifteen percent comment
it is arguing rather than explaining, and the comments are the part to cut.

**Prettier owns formatting, ESLint owns correctness.** `eslint-config-prettier` is last in
the config so the two do not argue. Never hand format code to make it look nicer, run
`npm run format`.

**Styling is the MUI `sx` prop and the theme.** No CSS files, no CSS modules, no layer of
our own styled components. The theme is small on purpose. If you find yourself building a
design system on top of MUI, stop.

## Things that look like help and are damage

- **Adding a dependency.** The runtime install is React, React DOM, MUI, emotion,
  `@mui/utils`, React Router, TanStack Query, zod, React Hook Form and its zod resolver.
  Each one is argued for in the README. Check that list before you reach outside it: a form
  uses React Hook Form with `zodResolver` and a schema from `model/schemas.ts`, which is
  what makes one object decide whether the submit button is enabled, what the message under
  the field says, and what value is written. Adding a library to solve something small is a
  cost the next person pays. Ask first.
- **Adding a backend, authentication, or real persistence.** All explicitly out of scope.
- **Writing a URL or any other per-environment value as a literal.** It goes in
  `shared/config.ts`, read from `import.meta.env`, with the current value as the fallback.
- **Making a deliberate user action replace the history entry instead of pushing one.**
  Only continuous typing replaces, because it produces states the user never chose. A
  filter, a sort, a page and a page size are each one decision, and back is how people
  undo a decision. This was got wrong twice. First everything but paging replaced, so
  changing the city four times left one entry and back had nowhere to go. Then search
  replaced whenever a search existed before and after, which made swapping "Leanne" for
  "Ervin" look like more typing and collapsed three searches into one entry. The rule now
  asks whether the new term continues the old one in either direction; anything else is a
  new search and pushes.
- **Deleting the loading, empty, no-results or error states** because the fixture always
  succeeds. They exist for the API this will meet, not the one it has, and two of them are
  reachable today with a query string.
- **Flattening the folders** because the app is currently small. The structure is the
  decision, and it is what makes the second feature a new folder rather than edits
  everywhere.
- **Turning off `exactOptionalPropertyTypes` or any other strict flag.**
- **Disabling an ESLint rule inline** to get past an error, instead of fixing what the rule
  found.
- **Writing a test that renders a component and asserts nothing.** It is worse than no test
  at all, because it reports green while checking nothing.
- **Writing a helper the library already ships.** `visuallyHidden` was hand rolled here
  until somebody noticed `@mui/utils` exports it, with the `margin: -1px` and `border: 0`
  the copy had missed. Search the installed packages before adding a util, and if you do
  import from one that arrived as a transitive dependency, declare it in `package.json`
  rather than relying on another package to keep pulling it in.
- **Putting something in `shared/ui/` that is not a component.** It holds components. A
  style constant among them makes the folder mean two things, and the `.ts` among the
  `.tsx` files is the tell.
- **Making one large commit at the end.** See below.

## Commits

Conventional commits: `chore`, `feat`, `fix`, `test`, `docs`. The subject says what
changed. Where the commit carries a decision, the body says why.

One commit is one coherent change. Nothing unrelated is smuggled in. Do not commit a broken
state and fix it quietly in the next one.

Work goes straight to `main`. This is a solo repo, so a branch would only add merge noise
to a history that is itself part of what is being delivered. On a team repo this would be
short lived branches with a pull request per change and protection on `main`.

## Traps this codebase has already sprung

Every one of these was a real bug here, not a hypothetical. They are the reason to read
this file rather than infer the conventions from the code.

**The local edit overlay goes on before the search and the sort, never after.**
`usersApi.listUsers` merges it and then calls `queryUsers`, in that order, and the order is
the whole feature. Merge afterwards and the row shows the new name while the filtering and
sorting still run on the old one, so searching for the name on screen finds nothing and the
row sorts under a value nobody can see. It reads as three unrelated bugs and it is one line
in the wrong place. `model/applyEdits.ts` says the same thing at the top.

**What stops a stale response is the query key, not the abort signal.** The whole
`UsersQuery` object is the key, so a slow answer for an older view belongs to a different
cache entry and physically cannot overwrite a newer one. The signal only saves wasted work;
the state would still be correct without it. Narrowing the key to "search" or "page"
reintroduces the race, and it will not show up on a fixture that answers in 30ms.

**Something belongs in a query key only if it changes the answer.** The local edit overlay
is in the list's key, because search and sort run over renamed values, so a different
overlay really is a different page of results. It was also in the detail's key, where it
changes nothing, and that made one local rename cost three network requests instead of one.
For the detail the overlay is applied in `select`, after the cache rather than inside its
identity.

**`getSnapshot` must return the same reference until the value really changes.**
`model/userEdits.ts` keeps the parsed overlay in a module variable. Reading `localStorage`
inside the getter hands back a new object every call, which `useSyncExternalStore` reads as
a change on every render, and it loops until React gives up. The same file reads lazily
rather than at import, so everything in `model/` stays importable without a browser.

**The dialog is a URL parameter, so a guard on its close handler is not a guard.** Escape,
the backdrop, the Close button and the browser's back button all end as the same
navigation. An unsaved rename is protected by one `useBlocker`, which sees all four. The
first version checked the component's own close path and let the back button discard the
edit in silence.

**MUI puts the dialog's `aria-labelledby` id on `DialogTitle` unless you give it one.**
The heading inside it then shares that id, two elements answer to it, the outer one wins,
and the dialog's accessible name becomes the heading plus every word of whatever else is in
the title row. Lighthouse scores accessibility 100 with this present. So does the focus
outline bug the theme fixes: `MuiButtonBase` sets `outline: 0` at the same specificity as a
global focus rule and is injected after it. Neither is caught by a score; both were caught
by tabbing through and reading computed styles.

**Changing the shape of anything stored is a migration, not an edit.**
`shared/lib/storage.ts` wraps the value as `{ v, data }` and returns the fallback whenever
`v` does not match or the schema rejects what it finds. The schema validates the whole
record at once and the fallback is the whole store, so adding a required field to
`UserEdit` discards every rename already on disk, on every machine, whether or not you bump
the version. Add new fields as optional, or bump the version deliberately and say in the
commit message that saved edits are being dropped.

**MUI containers scroll on both axes.** `TableContainer` and `TablePagination` default to
`overflow: auto`, which wraps a box whose height is always exactly its content in a second
vertical scrollbar inside the page's own. The table container is `overflowX: 'auto'` with
`overflowY: 'hidden'`, because sideways is the one direction it really does need. The
pagination is `overflow: 'hidden'`, because it wraps instead and never needs to scroll at
all. On the axis you are switching off write `hidden`, not `visible`: CSS computes an axis
set to `visible` back to `auto` when the other one scrolls, so `visible` hands you straight
back the thing you were removing.

**An absolutely positioned element escapes the box you think it is in.** The visually
hidden "Actions" label in the table header had no positioned ancestor, so its containing
block was the page. The scroller could not clip it, the document grew sideways to reach
its static position at roughly 610px, and a phone got a page level horizontal scrollbar
next to the table's own. The element is one pixel wide and clipped, so nothing looked
wrong and a scan for elements sticking out past the viewport found nothing. The scroll
container carries `position: relative` for exactly this.

**A table sizes to its content unless you tell it not to.** On the default `table-layout`
this one sized to its longest cell, 752px, whatever the window was doing, so the sideways
scrollbar turned up at widths with room to spare. It is `table-layout: fixed`, which makes
the declared column widths binding, with `text-overflow: ellipsis`, because a column that
cannot grow has to be allowed to clip.

**A percentage width on a column that holds a control.** The actions column is `64px`, not
a share of the table, because a share shrinks below the button it exists to hold.
