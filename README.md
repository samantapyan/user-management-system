# User management panel

A single screen that lists users, lets you search, sort and filter them, open one, and
rename them so the change survives a reload.

**Applying for: Senior Frontend Developer**

---

## Where each answer is

| The task asks for                                | Section                             |
| ------------------------------------------------ | ----------------------------------- |
| The level I am applying for                      | top of this file                    |
| How to run it                                    | Running it                          |
| Which component or styling library, and why      | The stack, and why                  |
| Edited users against fresh server data, and why  | Gap 2                               |
| Devices, input methods and settings checked, how | Accessibility, devices and settings |
| Gaps and contradictions in the requirements      | Gaps and contradictions             |
| Assumptions made instead of asking               | Assumptions                         |
| What is missing, and why                         | Tests                               |
| What is still wrong with this                    | its own section                     |
| What I would need before building this for real  | its own section                     |

## Running it

Node 20.9 or later.

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

```bash
npm test             # the unit tests, once
npm run test:watch   # the same, staying open
npm run build        # tsc -b && vite build, output in dist/
npm run preview      # serve the production build on http://localhost:4173
npm run verify       # typecheck, lint, format check, then the tests
```

The API it points at is configuration, not a literal in the source. Copy `.env.example` to
`.env.local` and set `VITE_API_BASE_URL` to use a different one. Unset, it uses the public
fixture.

`npm run build` runs the TypeScript compiler before Vite on purpose. Vite does not
typecheck. It strips types with esbuild and never looks at them, so the dev server will
happily serve code that does not compile. Strict mode is worth nothing if nothing runs the
compiler.

## What this is, and where it stops

It does: list users, search by name or email, sort by name, filter by city, open a user's
detail, and rename a user so the change survives a reload.

It does not: create or delete users, roles and permissions, an audit trail, authentication,
or a backend. The repository is called a user management panel, and user management usually
means more than this. The requirements ask for listing and renaming, and the task puts a
backend, authentication and real persistence out of scope, so that is where I stopped. I
would rather say where the line is than leave you guessing whether I forgot.

## The stack, and why

**React and TypeScript in strict mode.** Required. Strict is on from the first commit,
along with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
`noImplicitReturns` and `noPropertyAccessFromIndexSignature`. Turning strictness on at the
end means fixing every error at once, by which point the workarounds are already written
and the flags just get switched back off. ESLint also makes `any` and non-null assertions
errors, so the ways out of the type system have to be argued for rather than used quietly.

**Vite, not Next.js.** A build step was never optional; the question was Vite against a
framework. Next.js earns its cost when you need the server: rendering, server components,
image optimisation, file based routing. This app has no backend, one screen and nothing to
index, and every hard requirement is a client concern: URL state, the back button,
`localStorage`, a stale response never overwriting a newer one. Server components cannot
touch `localStorage`, so almost everything would be a client component and I would be
paying for a tool I had just switched off.

**MUI, used as it comes.** No design was provided, so I took a library that already has a
finished visual language and, more importantly, accessible dialogs, selects, focus handling
and table semantics. That way the time goes on layout, states and behaviour rather than
on rebuilding a focus trap. The task puts a design system out of scope, so I set a small theme
and stop there. Emotion is not a separate choice, it is the engine MUI renders through, and
the build fails without it.

The theme is small but not empty. It carries three things a user cannot ask for through the
interface: reduced motion respected, touch targets of at least 44px, and a focus ring
visible on both colour schemes. Light and dark are CSS media queries with no JavaScript, so
there is no flash of the wrong one. The font is the system stack, which saves about 70kB
and a flash of fallback text, and moves the screen away from looking like a stock Material
demo, the main risk of taking a component library.

**What I would choose instead, if the question changed.** If a design existed, MUI would
become a cost rather than a benefit, because I would spend the day overriding its defaults.
Then a headless library like Radix plus my own styling is right, since the look is already
decided and I only need the mechanics under it. And if a company design system already
existed, none of this applies and I would use that instead of bringing a second system into
the product.

**TanStack Query, for the request lifecycle.** It is not really a data fetcher. It is a
cache with a request lifecycle attached, and the lifecycle is the part I wanted. Without it,
`useEffect` and `useState` mean hand writing loading, error, retry, cancellation,
deduplication and staleness for every call, and getting one of them subtly wrong per screen.

The reason it is here rather than an alternative is narrower. A stale response must never
overwrite a newer one, and the cache key answers that: the whole query object is the key,
so two views are two entries and a late answer cannot land where the newer one lives. The
shape of the cache prevents it, not a check somebody remembers to write, so it holds for a
race nobody predicted. Against this fixture the race cannot occur at all, because ten rows
and client side search mean no request per keystroke; it is handled because the code is
written for the API it will meet. The abort signal cancels unwanted work, the key is what
makes the answer correct. `keepPreviousData` stops the table blanking between pages, and
the retry policy is where a 404 stops being worth asking twice.

What I considered instead: SWR, which is smaller and would have done the caching, but has
less around mutations and cancellation, and the mutation path is where the rename goes.
RTK Query, which is excellent and arrives with Redux, and a store is a large thing to adopt
for one screen. Writing it by hand, which is the honest default for a single request and the
wrong one the moment there are four states and a race.

**Zod, for data that comes from outside.** TypeScript types are erased before the code runs,
so `payload as User[]` is a promise the compiler cannot keep. It is true right up to the day
the API changes a field, and then it fails as `undefined is not an object` three components
away from the cause, which is the most expensive kind of bug to read.

One schema gives both the runtime check and the type, so they cannot drift apart. It earns
its place twice more later: the response schema drops fields the app should never carry, and
the same approach validates what comes back out of `localStorage`, where the data was
written by an older version of my own code and has to degrade to a default rather than crash
the screen.

What I considered instead: Valibot, which is meaningfully smaller and would be the right
answer if bundle size were the binding constraint here. Hand written type guards, which are
fine for one shape and unmaintainable by the third. And no validation at all, which is the
common choice and the one that produces the error above.

**React Router, for a screen with no routes.** This one I argued myself out of and then back
into, so the reasoning is worth having.

The case against is real. There are no routes here, not few. The router resolves one path,
and the only hook the screen needs from it is `useSearchParams`. About thirty lines on
`useSyncExternalStore` and the History API would have done it, with nothing added to the
bundle, and writing it demonstrates knowing why the naive version breaks: `pushState` and
`replaceState` do not fire `popstate`, so anything hand rolled has to notify its own
subscribers.

Three things decided it the other way. An unsaved rename that is not silently lost is close
to unimplementable without a router: `popstate` fires **after** the navigation, so a back
press cannot be cancelled, only undone by pushing a state back and hoping. `useBlocker`
stops it properly, which is why this is `createBrowserRouter` rather than `BrowserRouter`.
Second, a user management panel will grow a second screen, and then the route table gains a
line instead of the app gaining a router. Third, consistency: the data layer is already
written for the API this will meet, and building navigation for only today's screen would
contradict that in the same codebase.

**React Hook Form, for one field.** One text input hardly needs a form library. What it
carries is the requirement that an unsaved rename is not silently lost, which needs a
trustworthy answer to "has this changed", and hand rolled dirty tracking is exactly what
rots quietly. It also takes the zod schema directly, so one object decides whether Save is
enabled, what the message under the field says, and what value is written. Uncontrolled, so
typing does not re-render the dialog around it.

**localStorage, not IndexedDB.** The edits are a few hundred bytes, scoped to one person,
and needed synchronously before first paint. IndexedDB is asynchronous and is the right
answer for offline or thousands of cached records, neither of which is asked for. What
localStorage needs is defending: it outlives deploys, so today's code reads what last
month's wrote, a person can edit it by hand, and the browser can refuse both reads and
writes. So the value carries a version, what comes back is validated with zod before it is
trusted, and a refused write is reported on screen rather than swallowed.

**What they cost.** Zod and TanStack Query together added 30kB raw and 9kB gzipped. React
Router added 98kB raw and 31kB gzipped, which is the largest single cost in the project after
MUI and by some distance the most arguable. React Hook Form and its zod resolver added 39kB
raw and 13kB gzipped. All measured before and after, not estimated.

The build splits dependencies from application code, because the two change at completely
different rates and a deploy should not throw away a browser's cached copy of React:

```
index    22kB raw    9kB gzipped     the application
vendor  175kB raw   53kB gzipped     zod, TanStack Query, React Hook Form
mui     295kB raw   92kB gzipped     MUI and emotion
react   323kB raw  101kB gzipped     React, React DOM, React Router
```

256kB gzipped in total is a lot for one screen, and almost all of it is the component
library. The MUI chunk alone grew 20kB gzipped across the detail view and the rename, purely
from the components those needed: a dialog, a tooltip, a chip, a text field. That is the
price of the MUI decision above, stated rather than hidden.

**Added when it was needed, not on day one.** React Hook Form arrived in the commit that
uses it, and Vitest in the commit that added the tests, so the history shows what each one
was for rather than a dependency list appearing on the first day for reasons nobody can
reconstruct afterwards. React Testing Library was planned the same way and never arrived,
because nothing here renders a component to test it. The tests section says why.

## Gaps and contradictions in the requirements

Twelve places where the requirements are silent, or where two of them cannot both be true.
Each one has the decision I made for it. Several are not free choices, and those say so.

This is the first of three related sections, and they are deliberately not the same list. A
**gap** is something about the specification: it is silent, or it disagrees with itself, and
the evidence is in the task text. An **assumption** is something about me: I filled a blank
with a belief and carried on, and if the belief is wrong then work has to change. A
**question** is what I would ask to remove an assumption. So a gap ended in a decision, an
assumption is a risk I am still carrying, and a question is what would settle it.

### 1. A detail view, with no routing model given

Only `GET /users` exists, nothing says how a single user is reached, and the scope section
rules out routing beyond what this screen needs. A separate page and a modal are both
allowed. I chose a modal, and I keep the opened user in the URL as `?user=3`, so a reload
reopens it, the back button closes it, and the link is still shareable.

### 2. Rename a user with no write endpoint, and which data wins

There is only a `GET`. The API is not read-only either, which is worse: it accepts `PATCH`,
answers `200`, and persists nothing. A naive implementation looks like it worked, and the
change is gone on the next reload with no error anywhere to explain it.

So the change can only survive locally, and that settles the question the task asks
separately. When a local edit and fresh server data disagree, **the local edit wins.** I
want to be honest that this is barely a choice: the requirements say nothing a user has
done should disappear because they reloaded, and the API never persists anything, so
"server wins" would delete the edit on every single reload and break the other requirement.
The missing endpoint decides this, not me.

Two things make the decision less lossy. Only the fields that changed are stored, never a
copy of the whole user, so every field that was not edited stays fresh from the API. And an
edited row is marked in the interface and can be reverted, so nobody is stuck with a value
they cannot undo.

Then there is the part nothing in the task mentions, which is the real trap in it: a
renamed user has to stay findable. Search and sort have to use the new name, so local edits
are merged into the data **before** filtering and sorting, never after. Apply them after and
the row displays the new name, searching for that name finds nothing, and the sort order is
built from a value nobody can see on screen. It is one line in the wrong place, and the bug
it causes looks like three unrelated bugs.

### 3. "Nothing a user has done should disappear" has no boundary

The rename is clear, and there is a requirement that states it exactly. But does it also
cover the search text, the sort order, the city filter, the current page? Nothing says.

I decided yes, and all of them live in the URL, so a reload gives back the same view.

I deliberately do **not** restore a half typed name that was never saved. Bringing back text
a user abandoned is a bug, not a feature. An unsaved change gets a warning instead.

The warning covers every way out, because there is only one. The dialog is opened and
closed by a URL parameter, so Escape, the backdrop, the Close button and the back button
are all the same navigation and one `useBlocker` sees all four. Guarding the component's
own close handler would have caught three and let the back button discard the edit without
a word. It does not cover a reload or a closed tab: that needs `beforeunload`, whose prompt
the browser writes and the page cannot word, so I left it out rather than ship a dialog I
do not control.

### 4. The back button, with no navigation model specified

"The back button should do what a user expects it to" does not say what the navigation model
is. With the modal, back closes the modal rather than leaving the screen.

The part that actually matters is which changes create history entries, and I got this
wrong the first time. My original rule was that refining the view replaces and navigating
pushes, so search, city and sort all replaced. Changing the city four times then left one
history entry and back had nowhere to go.

The right distinction is continuous against discrete. Typing produces a state per pause in
the keystrokes and the user chose none of them, so refining a search replaces. Picking a
city, toggling the sort, turning a page and changing the page size are each one deliberate
decision, and back is how a person expects to undo a decision, so those push. It is what a
search engine does: results update as you type without touching history, and every filter
you click is its own entry.

Then I got the search half of it wrong too, and it took a second report to find. The rule
only asked whether a search existed before and after, so replacing "Leanne" with "Ervin"
counted as more typing. Three searches collapsed into one history entry and a single press
of back threw away all three.

What the rule asks now is whether this is the same term still being written: typing further
into it, or backspacing over it, is one search being composed and replaces. A term that is
not a continuation of the last one is a new search and pushes, as does the first one and
clearing it again. So "L" to "Le" to "Leann" is one entry, and "Leanne" to "Ervin" to
"Patricia" is three.

The cost is that ten deliberate changes are ten back presses, and that is correct, because
they were ten choices. Pushing on every keystroke would be the other failure, where leaving
the page takes twenty.

### 5. "Searchable by name or email" does not say how

There is no search endpoint, so every part of this is mine to decide: exact or partial,
case sensitive or not, prefix or substring, debounced or not, client or server.

I chose case-insensitive substring matching over name and email, on the client, with the
value debounced before it is written to the URL. The input itself is never debounced,
because a laggy text field is worse than a slightly late URL.

### 6. Ten rows that never fail, and also far more rows than ten

"It returns ten users instantly and never fails" and "when there are far more rows than ten"
cannot both describe the same API. Against this fixture there is no way to genuinely
exercise pagination or load. The only real condition I can reproduce is a slow network, from
browser devtools.

I chose pagination, and I shape the data layer like a real server: a query object goes in,
`{ items, total }` comes out. Today the fixture is fetched once and filtered, sorted and
paged on the client, behind that contract. When a real backend appears, one module changes
and no component knows.

Since the fixture cannot exercise this, I measured it instead, by generating users and
running the real query functions and the real screen against them.

| per query               |    100 |  1,000 | 10,000 |    100,000 |
| ----------------------- | -----: | -----: | -----: | ---------: |
| parse and validate      | 0.5 ms | 2.6 ms | 6.2 ms |      43 ms |
| page 1, sorted          | 0.1 ms | 1.7 ms |  20 ms | **214 ms** |
| search matching many    | 0.03ms | 0.3 ms | 3.1 ms |      31 ms |
| search matching nothing | 0.02ms | 0.1 ms | 1.1 ms |      11 ms |
| cities for the dropdown | 0.01ms | 0.03ms | 0.2 ms |     2.7 ms |

In the browser, with the real screen and a stubbed API: at 10,000 rows nothing blocks the
main thread for more than 50ms at all. At 100,000 the longest blocking task is 242ms, and
Lighthouse's mobile profile throttles the CPU four times, so on a mid-range phone that is
closer to a second of frozen interface per query.

Sorting is nearly all of the cost, and nearly all of the sorting is the collator. On 10,000
rows the whole query is 20ms and 17.8ms of it is the sort. The same sort with a plain `<`
comparison takes 4.2ms, so ordering non-ASCII names correctly costs about four times as
much. That is worth paying, and worth knowing you are paying.

Filtering before sorting is doing real work, which the numbers show: a search matching
nothing costs 11ms at 100,000 rows against 214ms for no filter, because there is nothing
left to sort.

**So the honest limit is around ten thousand rows.** Below it this screen is
indistinguishable from the ten-row fixture. Above it, search, sort and paging have to move
to the server, which is what the `{ items, total }` contract is for.

That limit is also where the task contradicts itself hardest, because the other requirement
is local edits. Past the same size the query work belongs on the server, and the server
knows nothing about a local rename: renamed from "Zoe" to "Aaron", the row reads "Aaron",
is still sorted and searched as "Zoe", and searching "Aaron" returns nothing. The client
cannot repair it, because it only ever sees one page. Local edits are correct only while
the whole dataset is on the client, and that is viable to about ten thousand rows. The same
number, so ten thousand is where this design stops working, not where it starts to feel
slow. I would rather name the limit than ship something that breaks quietly at the size the
task asks me to build for.

There is an optimisation available and I deliberately did not take it. Sorting once per
direction and caching it, then filtering the sorted array, would turn 214ms per query into
214ms once and about 30ms after, because filtering preserves order. It would also add a
module-level cache with identity-based invalidation to a pure module, to speed up a size the
architecture already says belongs on the server. Making the wrong answer survive longer is
not an optimisation.

### 7. "Never fails", and also "hold up when a request fails"

The same paragraph says the API never fails and that the interface has to survive a request
failing. I also do not accept "never fails" as true of anything: offline, DNS, CORS, a rate
limit, a proxy in the middle.

So there is an explicit error state with a retry, and the data layer can surface failures
even though today's fixture will not produce one. The full set is loading, success, error
and empty, and empty needs two versions: there is no data at all, and there is no data for
the current filters. The second one offers a way to clear the filters, because otherwise the
user is looking at an empty screen with no way out.

### 8. Filter by city, with no type specified

Dropdown, autocomplete, single or multiple selection, none of it is stated. I chose a single
select dropdown, with the list of cities built from the loaded users.

That only works while the whole dataset is on the client. The moment the list is paginated
on a server, the dropdown would show only the cities on the current page, which is wrong in
a way that is hard to notice. At that point a real endpoint for the city list becomes
necessary. Noting it here rather than discovering it later.

### 9. "Responsive and usable" with no detail at all

Nothing is specified: breakpoints, tablet behaviour, keyboard support, screen readers,
reduced motion, contrast, touch target size, browser support. This is a deliberate gap.

So I decided them. Breakpoints are mine, touch targets are at least 44px, `prefers-reduced-motion`
and `prefers-color-scheme` are respected, and there is a keyboard-only pass over the whole
screen. What I actually checked, and how, is in its own section below, and it lists only
what I really did rather than what I assume works.

One of those decisions has a visible cost. One long value used to widen its column and
squeeze the others: measured with a 120 character name, the table went from 974px to 1663px
and pushed Company off screen on every row. `table-layout: fixed` with `text-overflow:
ellipsis` fixes that, and the price is that a long email is cut short at narrow widths and
has to be read in the detail view.

### 10. Sort by name, but the data has two names

The API returns both `name` ("Leanne Graham") and `username` ("Bret"), and the requirement
does not say which one to sort by. Nor does it say the default direction, or whether it
toggles.

I sort by `name`, ascending by default, toggleable. Since `name` is a single string with no
separate family name, sorting by name is really sorting by first name, which is worth
knowing before someone reports it as a bug. I use `Intl.Collator` rather than comparing with
`<`, because a plain comparison sorts anything non-ASCII wrongly, and user names are exactly
the data where that happens.

### 11. No validation rules for the new name

Nothing says whether the name can be empty, whether spaces only counts, how long it may be,
or whether duplicates are allowed.

I chose: trim the value, required, between 2 and 60 characters, duplicates allowed, and save
disabled while invalid with the reason shown inline rather than after submitting.

### 12. Two tabs open at once

Nothing says what should happen if the same user is edited in two tabs. Half of it is
answered: the edit store listens for the browser's `storage` event, so a rename in one tab
reaches every other tab on the same screen and they agree without a reload.

The collision itself is not answered. Two tabs renaming the same user at the same moment is
last write wins, with no merge and nothing telling either of them it happened. That half is
in "What is still wrong with this", because I did not solve it rather than decided it.

## Assumptions

Things I took as true without being told and without asking, none of them already covered
by a gap above. Each one would change work if it turned out to be wrong.

**The fixture response shows the real shape of the data.** I rely on `id`, `name`, `email`,
`address.city`, `company.name` and `phone` being present on every user. I validate the
response against a schema, so a record missing one of those is rejected rather than rendered
half filled. If a real API returns partial records, that is the wrong call and the schema
has to allow them instead.

**`id` is stable and unique.** Local edits are stored keyed by `id`. If ids were ever
reused, an edit would silently attach to a different person, which is the worst class of bug
this app can have.

**"City" means `address.city`.** The address is nested and also contains `street`, `suite`
and `zipcode`. Nothing says which field the filter is supposed to mean.

**One person per browser.** There is no authentication, so local edits are stored per
browser and not per account. On a shared machine, one person's edits are visible to whoever
uses it next. With real authentication the storage key would have to include the account.

**Desktop and phone matter equally.** Nothing said which one is primary, so I treated
neither as secondary.

**Evergreen browsers only.** I use `dvh` units, `:focus-visible`, `Intl.Collator` and native
modules. None of this supports Internet Explorer, and an older Safari would need checking
before I claimed it works.

**Node 20.9 or later** to run it, because that is what I built and tested on.

**English only, left to right.** No localisation and no right to left support. That affects
layout, formatting and the sort collation, so it is not a small assumption to have made
quietly.

**The fixture API stays reachable.** If jsonplaceholder is down when this is read, the
screen shows its error state with a retry. That is correct behaviour, but it means a
reviewer sees an error rather than the app, so it is worth knowing before concluding it is
broken.

**WCAG AA is the target.** No level was given, so I picked the one that is normally the
contractual default.

**The URL parameter names and the page size are mine.** Nothing specified a URL shape, so
`?q=`, `?city=`, `?sort=`, `?page=` and `?user=` are my choice. If this screen ever has to
keep old links working, those names stop being a detail and become a contract.

**Grading happens on `main`.** Everything is pushed there rather than left on a branch, so
the default branch is the finished state and there is nothing to go looking for.

## Architecture

```
src/
  app/            what boots the application: shell, providers, router, theme
  features/
    users/        the whole product in one folder
      api/        everything that talks to the network
      constants/  values the feature is configured by, not logic
      model/      logic with no JSX. The part worth testing
      ui/         components
      index.ts    the only file the outside may import
  shared/
    config.ts     anything that changes between environments
    ui/           components more than one feature would need
    lib/          helpers more than one feature would need
  test/           fixtures and fakes the tests share, no tests of its own
```

Tests sit next to what they cover, as `*.test.ts` beside the module, rather than in a
`__tests__` folder mirroring the tree. Two places to look for one thing is one too many,
and a test that has drifted from its module is harder to notice from another folder. The
one place the feature boundary is crossed is `src/test/makeUser.ts`, which imports the
`User` type from inside the feature: `import type`, so it erases and adds nothing to the
module graph, which beat widening the feature's public surface for a fixture.

Grouped by feature rather than by file type. A top level `components/`, `hooks/`, `utils/`
works for five files and stops working at around thirty screens, because from then on one
change touches four folders every time.

Four rules hold it together. Imports flow one way, so a feature may use `shared` and never
the reverse, and two features never import each other. A feature is entered through its
`index.ts`, so everything inside it can be renamed or moved without touching a file outside.
The network is touched only in `api/`, so no component ever knows a URL. And `model/` holds
the logic with no JSX, which is the part worth testing, because testing it needs no
rendered component: thirteen of the twenty tests point at it, four at `api/` and three at
`shared/lib/`, and not one of them needs a browser.

That shape costs requests against this fixture, and the number is worth stating rather than
hiding. `listUsers` and `listCities` both want the whole dataset and stay separate calls,
because a real backend answers them from separate endpoints: measured, two requests on
first load, 36ms and 47ms. A rename costs one more, because the overlay is part of the
list's cache key, which is what makes search and sort see the new name. Both disappear
against an API that can answer a query and accept a write.

What I deliberately did not do: the full Feature-Sliced Design layer stack, a monorepo, a
generated API client, Storybook, or a barrel file in every folder. At one screen those are
folders with one file in them, which is cost with no benefit. The generated client starts to
pay when there is a second consumer of the API, Storybook when someone other than me uses
the components.

## Accessibility, devices and settings

Only what I actually did. Where I did not check something, it says so, because a list of
assumptions dressed up as testing is worse than a short list.

**Lighthouse**, against the production build on `npm run preview`, not the dev server. The
dev server scores around 64 for performance because it ships unbundled, unminified modules,
and measuring it tells you nothing about what users get.

```
                Performance  Accessibility  Best practices  SEO
desktop             100           100            100        100
mobile               84           100            100        100
```

Mobile performance is 84 because of script parse and execution on a throttled CPU, not
because of anything on the screen: LCP 3.4s, Total Blocking Time 280ms, both the cost of
React, MUI and React Router being parsed before anything renders. It was 89 before the
detail view and the rename, and the difference is the extra MUI components those needed,
which is the 20kB from the stack section in a different unit. The only real ways down are
server rendering or fewer dependencies, and both are decisions already made above.

Layout shift is 0 on desktop and 0.021 on mobile, comfortably inside the 0.1 threshold. The
mobile figure is the pagination row settling once the real row count replaces the loading
one, and I measured it against the build from before this work to be sure it was not
something I had introduced: it was 0.022 then.

To reproduce any of this:

```bash
npm run build && npm run preview
npx lighthouse http://localhost:4173 --view
```

**Sizes**, in Chrome: 320, 375, 430, 1024 and 1280 wide. Below roughly 690px the table
scrolls sideways inside its container rather than squeezing five columns onto a phone. The
page itself never scrolls sideways at any width, nothing is a nested vertical scroller, and
every row stays one line high. The detail heading keeps the name and the edit control on
one line and shortens the name instead, which matters because a renamed user can be sixty
characters long.

**Keyboard**, tabbing through the whole screen and recording where focus landed and what it
looked like at each stop. Order is scroll region, then the sort header, then rows per page,
then the pagination buttons when they are enabled. The scrollable table is reachable with a
keyboard, which it is not by default: a container that scrolls but cannot be focused is
unusable without a mouse.

This is where the check earned its keep. MUI's `ButtonBase` sets `outline: 0` at the same
specificity as my global focus rule and is injected after it, so the sort header and the
page size select had **no visible focus indicator at all**. Lighthouse scored accessibility
100 with that present, because it cannot test whether a focus style is visible. Fixed in
the theme, and found only by tabbing through and reading the computed outline.

**The detail view and the rename form**, checked the same way. The dialog is named by its
heading, the field is labelled, an invalid value sets `aria-invalid` with the reason tied to
the field rather than only shown in red, Save is disabled while it is invalid so nobody
submits into a wall, and each row's button is named after its user so somebody listing the
buttons on the page hears which one opens whom.

This is where the second check earned its keep. MUI stamps the dialog's `aria-labelledby`
value onto `DialogTitle` itself unless it is given an id of its own, so the heading inside
it and the block around it both answered to the same id. The outer one won, and while the
rename form was open the dialog's accessible name became the heading followed by every word
of the form. Lighthouse scored accessibility 100 with that present as well.

**Colour scheme**, both light and dark through `prefers-color-scheme` emulation. Light and
dark are CSS media queries with no JavaScript, so there is no flash of the wrong scheme.

**Screen reader semantics**, checked in the DOM rather than with a reader: the sorted column
carries `aria-sort`, each row's name is a `th scope="row"` so a cell is never read without a
person attached to it, the result count and sort direction are announced through a polite
live region, and the empty state's cell spans the real number of columns.

### What I did not check

- **A real screen reader.** No NVDA, VoiceOver or TalkBack. The semantics are right in the
  markup, which is not the same as confirming they are announced usefully.
- **A real phone or tablet.** Emulated viewports only, so no real touch targets, no real
  scrolling feel, and no mobile Safari.
- **`prefers-reduced-motion` with the setting actually on.** The rule is in the theme and in
  the built CSS, but I did not toggle it at the operating system level and watch.
- **Zoom at 200% and 400%**, and Windows High Contrast.
- **Any browser except Chrome.** No Firefox, no Safari.

## Tests

Twenty tests in nine files, next to the modules they cover. `npm test` runs them, and
`npm run verify` runs them after the typecheck, the lint and the format check. They finish
in about a second.

Twenty rather than two hundred is the part worth explaining. Every test in here names a
bug it would catch, in a comment above the assertion, and one that could not name a bug
was not written. A coverage percentage measures how much of the code a suite happened to
execute, which is not the same as how much of it is protected, and it is easy to get a
high one out of tests that would pass whatever the code did.

**What they protect.**

- **The edit overlay, which is what this feature turns on.** Renames are merged in before
  the search, the sort and the paging run. Two tests, because merging them in afterwards
  produces two unrelated looking symptoms: a search that cannot find a name printed on the
  row in front of you, and a row sitting on the wrong page.
- **The markers on renamed rows**, which have to describe the rows that were returned
  rather than whatever the edit store says by the time the render runs.
- **Paging that does not lose a row.** Sorting is stable, so without the tie break on id
  the order the API happened to return is the order on screen. The test walks every page
  twice, with the fixture in two different orders, because a single order cannot catch it.
- **The URL in both directions**, as a round trip over nine views, plus eleven URLs nobody
  should have typed. `?size=100000` is the one that matters: admitted, it is a request for
  ten thousand rows.
- **The view state machine**, where the same error and the same rows have three different
  right answers depending on whether those rows answer the query that just failed.
- **The storage layer**: six ways a browser lets you down, each read as the fallback rather
  than thrown during a render, and a refused write that is reported instead of swallowed.
- **A cancelled request against one that timed out.** Both arrive as the same kind of
  `DOMException`, and confusing them puts an error on screen for every superseded keystroke.
- **The two edges data crosses**: what the API may send and still be understood, and what
  may come back out of `localStorage`, which anybody can edit by hand.

**They were checked by breaking the code.** A passing test proves nothing about whether it
would ever fail, so I broke the source nineteen different ways, one at a time, and ran the
suite against each: the overlay merged in after the query, the tie break removed, the page
clamp removed, the collator swapped for `<`, a cancelled request reported as a network
failure, storage ignoring the version it wrote, a refused write reported as a success, the
rename form validating before trimming, and so on. Every one was caught, and every one of
the twenty tests fails under at least one of them. Nothing in here is decoration, and that
is a measurement rather than a claim.

**One dev dependency, and no browser.** Vitest, and nothing else. The only browser API this
app touches is `localStorage`, so the two files that need it install a fake that can be
told to refuse a read, refuse a write, or deny access to the store outright. No real
browser will do that on demand, which makes the fake the subject of the test rather than a
stand-in for something better. It is Vitest 3 rather than 4 because 4 needs Node 20.19 and
this is built on 20.9.

**What is deliberately not tested.** Nothing that renders. The behaviour worth covering
there is the guard on an unsaved rename, and reaching it means React Testing Library, a
DOM environment and a router in the test. That is a real gap and it is the first thing I
would add. The `useSyncExternalStore` wiring in the edit store is the same story: it needs
a renderer, and faking one would only test the fake. `historyModeFor`, the rule deciding
which search gets its own history entry, is private inside `useUsersParams`, and testing
it means moving it into its own module the way `usersParams` and `openUserParam` already
are. I would rather name it here than change source to make a test possible. What I would
still not write is a test that mounts a component and asserts that it mounted.

## What is still wrong with this

Defects I know are in my own code and did not fix. Decisions and the costs they carry are
in the gaps and the stack above; this list is only the things that are wrong.

**Two tabs renaming at once loses one of the names silently.** A second tab does learn
about a rename, because the store listens for the `storage` event. What it cannot survive
is a simultaneous collision: one name wins, the other is gone, and neither tab says so.
There is no server holding the real value to resolve against, so this one is unsolved
rather than decided.

**The pagination row shifts once on mobile when the data lands.** Measured: 0.021 layout
shift on mobile, 0 on desktop, against a threshold of 0.1. While the list is loading the
count is zero, so the row reads "0-0 of 0" and wraps differently from "1-10 of 10".
Reserving the height would fix it. I measured it against the previous build to be sure I
had not caused it, found it was already there, and left it.

**The scrollable table region is a focus stop even when it does not scroll.** `tabIndex={0}`
is right while the table is wider than its container and a stop that does nothing when it
is not. Telling the two apart needs a `ResizeObserver`, which is more machinery than the
problem is worth.

**And one that is not in the code: nothing that renders is tested.** The guard on an
unsaved rename is the behaviour I would most want covered, and it is the one thing here
that cannot be reached without a renderer. The Tests section says what that would cost.

## What I would need before building this for real

The questions I would put to a product owner, roughly in the order the answers change the
most work.

**1. Who uses this every day, and for what?** A support agent looking up one person and an
administrator working through the whole list want different layouts. I am guessing about
which fields matter.

**2. How many users really, hundreds or hundreds of thousands?** Decides client against
server side filtering, pagination against virtualization, and whether local edits can work
at all. See gap 6.

**3. Who owns the visual language?** I would ask this first, because it flips the styling
choice outright. With no design a full component library is a benefit, because the visual
decisions are already made. With a design MUI becomes a cost I spend the day overriding,
and headless plus my own styling wins. With a company design system, neither applies.

**4. Will edits reach a real API?** The whole local against server decision changes the
moment a write endpoint exists. Until then local has to win, and that is the missing API
deciding rather than me.

**5. What happens when two people edit the same user at once?** Last write wins or
optimistic locking changes the data model and the error handling. If the other person has
to see it live, that is a socket, and a far larger scope than this screen.

**6. Is the name the only editable field, or the first of many?** A one field form and a
ten field form are different things, and I would build this differently from the start.

**7. Who is allowed to edit, and do we need roles?** It changes what the interface hides
and what the API has to return.

**8. Do we need an audit trail?** Normal for user management, and it lands on the data
model rather than on this screen.

**9. Do we need create and delete?** The screen is called user management, which promises
more than the requirements ask for. Next iteration, or deliberately out?

**10. Where does the city list come from, and is the filter single or multi select?**
Building it from the loaded users breaks the moment the data is paged.

**11. Should search cover username, company or phone too?** People expect search to find
whatever they typed. Two fields is a decision, not a default.

**12. Which browsers, devices and accessibility level?** WCAG AA, screen readers and older
browsers each change the estimate, and I would rather know before the screen exists than
after.

**13. Localisation and right to left?** Affects layout, date and name formatting, and the
sorting collation. Far cheaper to know now than to retrofit.

**14. Does this have to work offline?** The only question that would make me choose
IndexedDB over `localStorage`, so I want it answered before picking the storage.
