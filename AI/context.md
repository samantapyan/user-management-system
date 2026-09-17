# Working in this repo

The brief for anyone about to change code in this repo. It is written to be used, not
read. If you read only two sections, read "Rules that are not negotiable" and "Things
that look like help and are damage".

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
npm run verify     # typecheck, then lint, then format check
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
      model/            logic with no JSX. This is the part worth testing
      ui/               components
      index.ts          the only file the outside may import
  shared/
    config.ts           anything that changes between environments
    ui/                 components more than one feature would need
    lib/                helpers more than one feature would need
  test/                 setup and fixtures
```

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

**3. The network is touched in `features/*/api` and nowhere else.** No `fetch` in a
component, in a hook outside `api/`, or in `model/`. The abort signal and the error
handling live there too. If a component knows a URL, the layering has already broken.

**4. `model/` holds logic with no JSX.** The storage overlay, the URL to query mapping, the
schemas, the sort comparator. It is testable precisely because it does not need a rendered
component. When you are about to put logic inside a component, check whether it belongs
here instead.

**5. Two levels inside a feature at most, and no folder holding a single file.** If you
need a third level, the feature probably wants splitting in two. A folder with one file in
it is structure for its own sake.

**6. Do not export something until a file outside this one imports it.** An export is a
commitment that the symbol can no longer be renamed or reshaped without checking who
depends on it. Adding the keyword later costs one keystroke. If a helper can only be
tested by exporting it, test it through whatever does use it instead, or give it its own
module with a real surface. `index.ts` is the same rule one level up.

**7. The table's columns are defined once, in `constants/usersColumns.ts`.** Adding a
column is one entry in that array and nothing else. Sorting is the exception: `UsersQuery`
carries a direction and no field, so exactly one column can be sortable and it is named by
`SORTABLE_COLUMN_ID`. Making a second column sortable means adding `sortBy` to
`UsersQuery` first. If you find yourself editing the header, the row
component and a skeleton to add one column, stop: that is the bug this file was created to
remove, and a mismatch between them is only visible while data is loading, which is when
nobody is looking. The same applies to anything else that would otherwise be declared in
two places.

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

- **Adding a dependency.** The runtime install is React, React DOM, MUI, emotion, React
  Router, TanStack Query and zod, and each one is argued for in the README. Adding a
  library to solve something small is a cost the next person pays. Ask first.
- **Adding a backend, authentication, or real persistence.** All explicitly out of scope.
- **Writing a URL or any other per-environment value as a literal.** It goes in
  `shared/config.ts`, read from `import.meta.env`, with the current value as the fallback.
- **Making a deliberate user action replace the history entry instead of pushing one.**
  Only continuous typing replaces, because it produces states the user never chose. A
  filter, a sort, a page and a page size are each one decision, and back is how people
  undo a decision. This was got wrong once already: everything but paging replaced, so
  changing the city four times left one entry and back had nowhere to go.
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
- **Making one large commit at the end.** See below.

## Commits

Conventional commits: `chore`, `feat`, `fix`, `test`, `docs`. The subject says what
changed. Where the commit carries a decision, the body says why.

One commit is one coherent change. Nothing unrelated is smuggled in. Do not commit a broken
state and fix it quietly in the next one.

Work goes straight to `main`. This is a solo repo, so a branch would only add merge noise
to a history that is itself part of what is being delivered. On a team repo this would be
short lived branches with a pull request per change and protection on `main`.

## Not in this file yet

The traps that only exist once the code does. Rather than invent them, this section stays
open and is filled in as they turn up: the order the local edit overlay has to be applied
in, what actually stops a stale response from landing, and anything else that proves easy
to get wrong.
