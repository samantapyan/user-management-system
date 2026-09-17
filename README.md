# User management panel

A single screen that lists users, lets you search, sort and filter them, open one, and
rename them so the change survives a reload.

**Applying for: Senior Frontend Developer**

---

## Status

The decisions below are decided. Where something is not implemented yet, it says so.

Every section the task asks for is present. **What is still wrong with this** grows as the
code does rather than being collected at the end, and **Accessibility, devices and settings**
lists only what was actually checked, with what was not checked said out loud.

## Running it

Node 20.9 or later.

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

```bash
npm run build        # tsc -b && vite build, output in dist/
npm run preview      # serve the production build on http://localhost:4173
npm run verify       # typecheck, then lint, then format check
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

**Vite, not Next.js.** The browser cannot run TypeScript or JSX, so a build step was never
optional. The real question was Vite against a framework. Next.js earns its cost when you
need the server: server rendering, server components, image optimisation, file based
routing. This app has no backend, one screen, and nothing to index. Every hard requirement
here is a client concern: state in the URL, the back button, local storage, a stale
response never overwriting a newer one. Server components cannot touch `localStorage`, so I
would mark almost everything as a client component and pay for a tool I had just switched
off. Vite builds to static files, which matches a task where a backend is out of scope.

**MUI, used as it comes.** No design was provided, so I took a library that already has a
finished visual language and, more importantly, accessible dialogs, selects, focus handling
and table semantics. That way the time goes on layout, states and behaviour rather than
on rebuilding a focus trap. The task puts a design system out of scope, so I set a small theme
and stop there. Emotion is not a separate choice, it is the engine MUI renders through, and
the build fails without it.

The theme is small but not empty, and it carries three things a user cannot ask for through
the interface: reduced motion is respected, controls are at least 44px on a touch screen,
and the focus ring is visible on both colour schemes. Light and dark run on CSS media
queries with no JavaScript, so there is no flash of the wrong scheme on first paint. The
font is the system stack rather than a downloaded one, which saves around 70kB and a flash
of fallback text, and it moves the screen away from looking like a stock Material demo,
which is the main risk of taking a component library.

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

The reason it is here rather than any of its alternatives is narrower than that. The
requirement that a stale response must never overwrite a newer one is answered by the cache
key. The whole query object is the key, so two views are two entries, and a slow answer for
the older one cannot be written where the newer one lives. That is prevented by the shape of
the cache, not by a check somebody remembers to write, so it holds for a race nobody
predicted. `keepPreviousData` then gives paging that does not blank the table between pages,
and the retry policy is where it is decided that a 404 is not worth asking again.

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

Three things decided it the other way. The requirement that unsaved changes in the rename
form are not silently lost is close to unimplementable without a router. `popstate` fires
**after** the navigation has happened, so a back press cannot be cancelled, only undone by
shoving a state back onto the stack and hoping. `useBlocker` stops it properly, and it is why
this goes in as `createBrowserRouter` rather than the simpler `BrowserRouter`. Second, this
is a user management panel and it will grow a second screen, at which point the route table
gains a line instead of the app gaining a router. And third, consistency: the data layer is
already written for the API this will meet rather than the fixture it has, and building the
navigation for only the screen that exists today would contradict that in the same codebase.

**React Hook Form, for one field.** One text input hardly needs a form library and I would
not have added it for that alone. What it carries is the requirement that an unsaved rename
is not silently lost, which needs a reliable answer to "has this been changed", and hand
rolled dirty tracking is exactly the kind of thing that quietly rots. It also takes the zod
schema directly, so one object decides whether Save is enabled, what the message under the
field says, and what value is written. Uncontrolled by default, so typing does not re-render
the dialog around it.

**localStorage, not IndexedDB.** The edits are a few hundred bytes, scoped to one person,
and needed synchronously before the first paint. IndexedDB is asynchronous and is the right
answer for offline support or thousands of cached records, and neither is asked for here.
What localStorage does need is defending: it outlives deploys, so today's code reads what
last month's code wrote, a user can edit it by hand, and the browser can refuse both reads
and writes. So the stored value carries a version, what comes back is validated with zod
before it is trusted, and a refused write is reported on screen rather than swallowed.

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
uses it, so the history shows what it was for rather than a dependency list appearing on the
first day for reasons nobody can reconstruct afterwards. Vitest and React Testing Library
were planned the same way and never arrived; the tests section says what happened instead.

## Gaps and contradictions in the requirements

Eighteen places where the requirements are silent, or where two of them cannot both be true.
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

### 2. Rename a user so it survives a reload, with no write endpoint

There is only a `GET`. The API is not read-only either, which is worse: it accepts `PATCH`,
answers `200`, and persists nothing. So a naive implementation looks like it worked and the
change is gone on the next reload, with no error anywhere to explain it.

The change can therefore only survive locally. Local edits go to `localStorage` and are
reapplied on top of fresh API data after every fetch.

### 3. Local edits versus fresh server data, with nothing saying which wins

**Local edits win.** The user performed an explicit action and it should not be silently
undone.

I want to be honest that this is barely a choice. The requirements say nothing a user has
done should disappear because they reloaded, and the API never persists anything. So
"server wins" would delete the edit on every single reload and break the other requirement.
The missing write endpoint decides this, not me.

Two things make the decision less lossy. I store only the fields that were changed, not a
whole copy of the user, so every field I did not edit stays fresh from the API. And an
edited row is marked in the interface and can be reverted, so the user is never stuck with
a value they cannot undo.

### 4. "Nothing a user has done should disappear" has no boundary

The rename is clear, and there is a requirement that states it exactly. But does it also
cover the search text, the sort order, the city filter, the current page? Nothing says.

I decided yes, and all of them live in the URL, so a reload gives back the same view.

I deliberately do **not** restore a half typed name that was never saved. Bringing back text
a user abandoned is a bug, not a feature. An unsaved change gets a warning instead.

### 5. The back button, with no navigation model specified

"The back button should do what a user expects it to" does not say what the navigation model
is. With the modal, back closes the modal rather than leaving the screen.

The part that actually matters is which changes create history entries, and I got this
wrong the first time. My original rule was that refining the view replaces and navigating
pushes, so search, city and sort all replaced. Changing the city four times then left one
history entry and back had nowhere to go.

The right distinction is continuous against discrete. Typing produces a state per pause in
the keystrokes and the user chose none of them, so search replaces. Picking a city,
toggling the sort, turning a page and changing the page size are each one deliberate
decision, and back is how a person expects to undo a decision, so those push. It is what a
search engine does: results update as you type without touching history, and every filter
you click is its own entry.

The cost is that ten deliberate changes are ten back presses, and that is correct, because
they were ten choices. Pushing on every keystroke would be the other failure, where leaving
the page takes twenty.

### 6. "Searchable by name or email" does not say how

There is no search endpoint, so every part of this is mine to decide: exact or partial,
case sensitive or not, prefix or substring, debounced or not, client or server.

I chose case-insensitive substring matching over name and email, on the client, with the
value debounced before it is written to the URL. The input itself is never debounced,
because a laggy text field is worse than a slightly late URL.

### 7. Ten rows that never fail, and also far more rows than ten

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

There is an optimisation available and I deliberately did not take it. Sorting once per
direction and caching it, then filtering the sorted array, would turn 214ms per query into
214ms once and about 30ms after, because filtering preserves order. It would also add a
module-level cache with identity-based invalidation to a pure module, to speed up a size the
architecture already says belongs on the server. Making the wrong answer survive longer is
not an optimisation.

### 8. "Never fails", and also "hold up when a request fails"

The same paragraph says the API never fails and that the interface has to survive a request
failing. I also do not accept "never fails" as true of anything: offline, DNS, CORS, a rate
limit, a proxy in the middle.

So there is an explicit error state with a retry, and the data layer can surface failures
even though today's fixture will not produce one. The full set is loading, success, error
and empty, and empty needs two versions: there is no data at all, and there is no data for
the current filters. The second one offers a way to clear the filters, because otherwise the
user is looking at an empty screen with no way out.

### 9. The stale response race cannot happen against this API

"Typing quickly must not let a stale response overwrite a newer one" is a real concern and a
good thing to ask about. But with ten rows and client side search there is no request per
keystroke, so against this fixture the race cannot occur at all.

I handle it anyway, because the code is written for the API this will meet. The full query
object is part of the query key, so a late answer belongs to a different cache entry and can
never land on top of the current one, and the abort signal cancels the request that is no
longer wanted. The key is what makes it correct. The abort signal is an optimisation.

### 10. Filter by city, with no type specified

Dropdown, autocomplete, single or multiple selection, none of it is stated. I chose a single
select dropdown, with the list of cities built from the loaded users.

That only works while the whole dataset is on the client. The moment the list is paginated
on a server, the dropdown would show only the cities on the current page, which is wrong in
a way that is hard to notice. At that point a real endpoint for the city list becomes
necessary. Noting it here rather than discovering it later.

### 11. "Responsive and usable" with no detail at all

Nothing is specified: breakpoints, tablet behaviour, keyboard support, screen readers,
reduced motion, contrast, touch target size, browser support. This is a deliberate gap.

So I decided them. Breakpoints are mine, touch targets are at least 44px, `prefers-reduced-motion`
and `prefers-color-scheme` are respected, and there is a keyboard-only pass over the whole
screen. What I actually checked, and how, is in its own section below, and it lists only
what I really did rather than what I assume works.

### 12. Sort by name, but the data has two names

The API returns both `name` ("Leanne Graham") and `username` ("Bret"), and the requirement
does not say which one to sort by. Nor does it say the default direction, or whether it
toggles.

I sort by `name`, ascending by default, toggleable. Since `name` is a single string with no
separate family name, sorting by name is really sorting by first name, which is worth
knowing before someone reports it as a bug. I use `Intl.Collator` rather than comparing with
`<`, because a plain comparison sorts anything non-ASCII wrongly, and user names are exactly
the data where that happens.

### 13. A renamed user has to stay findable, and nothing says so

This is not written anywhere in the task and it is the real trap in it.

If a user renames someone, search and sort have to use the new name. That means local edits
must be merged into the data **before** filtering and sorting, not after. Apply them after
and the row displays the new name, searching for that name finds nothing, and the sort order
is built from a value nobody can see on screen.

It is one line in the wrong place and the bug it causes looks like three unrelated bugs.

### 14. The city filter is degenerate on this data

I checked the actual response. Ten users, ten different cities, every city appears exactly
once. So selecting a city always returns exactly one user, which makes the filter a slower
way to do a search.

I implemented it because it is required. But it is a data gap, and a filter that can only
ever return one row is not a filter, so I would rather say that than present it as a working
feature.

### 15. Local edits and "far more rows than ten" cannot both be true

This is the biggest contradiction in the task.

I am asked to persist edits locally, and to build for a dataset much larger than ten. Past a
certain size, search, sort and pagination have to move to the server. The server knows
nothing about local edits.

Concretely: a user renamed from "Zoe" to "Aaron" is still sorted and searched by the server
as "Zoe". So the row shows "Aaron", sits at the end of the list, and searching for "Aaron"
returns nothing. Nothing in the client can fix this, because the client only ever sees one
page.

Local edits are only correct while the entire dataset is on the client. Past that, the edit
has to reach the server. I would rather name the limit than build something that quietly
breaks at the size the task asks me to build for.

The measurements in gap 7 put a number on it. The whole dataset stays viable on the client
to roughly ten thousand rows, and local edits stay correct only while the whole dataset is
on the client. Those are the same number, so ten thousand rows is where this design stops
working, not where it starts to feel slow.

### 16. No validation rules for the new name

Nothing says whether the name can be empty, whether spaces only counts, how long it may be,
or whether duplicates are allowed.

I chose: trim the value, required, between 2 and 60 characters, duplicates allowed, and save
disabled while invalid with the reason shown inline rather than after submitting.

### 17. "User management screen" promises more than the requirements ask for

User management normally means creating and deleting users and managing roles. Here only
listing and renaming are asked for, and the scope section removes the backend,
authentication and real persistence that the rest would need.

So I kept it to reading and renaming. Where I stopped and why is in the scope section above,
rather than left for the reader to work out whether I ran out of time or decided.

### 18. Two tabs open at once

Nothing says what should happen if the same user is edited in two tabs. Half of it is
answered: the edit store listens for the browser's `storage` event, so a rename in one tab
reaches every other tab on the same screen and they agree without a reload.

The collision itself is not answered. Two tabs renaming the same user at the same moment is
last write wins, with no merge and nothing telling either of them it happened. That half is
in "What is still wrong with this", because I did not solve it rather than decided it.

## Assumptions

Things I took as true without being told, and without asking. These are the ones not already
covered by a gap above, so the two lists do not repeat each other. Each one would change work
if it turned out to be wrong.

This list grew during the work rather than being written once at the start. Anything near
the end of it was added when I actually hit it.

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
```

Grouped by feature rather than by file type. A top level `components/`, `hooks/`, `utils/`
works for five files and stops working at around thirty screens, because from then on one
change touches four folders every time.

Four rules hold it together. Imports flow one way, so a feature may use `shared` and never
the reverse, and two features never import each other. A feature is entered through its
`index.ts`, so everything inside it can be renamed or moved without touching a file outside.
The network is touched only in `api/`, so no component ever knows a URL. And `model/` holds
the logic with no JSX, which is exactly the part that is worth testing, because testing it
does not need a rendered component.

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
because of anything on the screen. Largest Contentful Paint is 3.4s and Total Blocking Time
is 280ms, and both are the cost of React, MUI and React Router being parsed before anything
renders. It was 89 before the detail view and the rename, and the difference is the extra
MUI components those needed, which is the same 20kB described in the stack section arriving
in a different unit. That is the price of the library choices above, and the only real ways
down from here are server rendering or fewer dependencies, both of which are decisions
already made and explained.

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
scrolls sideways inside its container rather than squeezing five columns into a phone, the
page itself never scrolls sideways at any width, nothing on the page is a nested vertical
scroller, and every row stays one line high. The detail view's heading holds the name and
the edit control on one line and shortens the name, rather than dropping the control to a
line of its own, which matters because a renamed user can be sixty characters long.

**Keyboard**, tabbing through the whole screen and recording where focus landed and what it
looked like at each stop. Order is scroll region, then the sort header, then rows per page,
then the pagination buttons when they are enabled. The scrollable table is reachable with a
keyboard, which it is not by default: a container that scrolls but cannot be focused is
unusable without a mouse.

This is where the check earned its keep. MUI's `ButtonBase` sets `outline: 0` on its root,
which has the same specificity as my global focus rule and is injected after it, so the sort
header and the page size select had **no visible focus indicator at all**. Lighthouse scored
accessibility 100 with that bug present, because it does not test whether a focus style is
actually visible. It is fixed in the theme, and I only found it because I tabbed through and
read the computed outline rather than trusting the score.

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

**There is no test runner in this repository, and no test files. That is the weakest part of
what I am handing over, so it gets said plainly rather than buried.**

What exists instead is six executable check suites, 123 assertions, run against the real
modules after every change while building. They cover the parts that are genuinely hard:

- the query pipeline: search, city filter, sort, the collator against a plain comparison,
  paging, page clamping, stable order for duplicate names, the live endpoint, cancellation
- the URL contract in both directions, including a hand edited URL that must not break the
  screen
- the view state machine: one state at a time, and a failed refresh that keeps real rows
  while discarding borrowed ones
- the detail dialog's parameter, and the trap that a filter change must not close it
- the edit overlay, including the trap this whole feature turns on: that search, sort and
  paging see the renamed value, and that applying the overlay afterwards would get it wrong
- the storage layer: a version it cannot read, a value the schema rejects, unparseable
  JSON, a browser that refuses to read, a browser that refuses to write, and other tabs

The assertions are written as sentences, so reading the output reads as a list of decisions
rather than a list of components.

What is wrong with this is not the coverage, it is the packaging. They were written as a
harness for myself rather than as a suite for you: they live outside `src/`, they are not
wired to `npm test`, and so you cannot run them. The checking happened and the handover did
not, and those are not the same thing.

Given more time the fix is small and specific: the same assertions under Vitest, unchanged
in substance, plus two that need a rendered component and a fake timer, which is the only
reason React Testing Library would come with it. What I would still not write is a test that
mounts a component and asserts that it mounted. A deliberate skip is worth more than that.

## What is still wrong with this

Written as problems are found rather than collected at the end. Two of them are already true
from the decisions above, before any of the screen exists.

**Two tabs renaming at the same moment is last write wins.** A second tab does find out
about a rename, because the edit store listens for the `storage` event. What it cannot do is
survive a collision: if both tabs save a different name for the same user at the same time,
one of the two is gone and neither tab says so. There is nothing to resolve the conflict
against, because there is no server holding the real value. Nothing in the requirements says
what should happen here, so this is one I have not solved rather than one I decided.

**The city filter only knows the cities it has already loaded.** The dropdown is built from
the users currently in memory. That is correct while the whole dataset is on the client, and
wrong the moment it is paginated on a server. The wrongness is quiet, which is the bad part:
the filter simply stops offering cities that exist, and nothing looks broken.

**A truncated cell cannot be read without opening the row.** One long value used to widen
its column and squeeze every other one: measured with a 120 character name, the table went
from 974px to 1663px and pushed the Company column off screen on every row. That is fixed,
with `table-layout: fixed` and `text-overflow: ellipsis`. The cost is the new problem: at
narrow widths a long email or company is cut short, and the only way to see it in full is to
open the detail view. A `title` on cells that actually overflow would fix it, and it needs
measuring per cell to avoid a tooltip on text that is not truncated, so I have not done it.

**The users list is requested twice on first load.** `listUsers` and `listCities` both need
the whole dataset, and they are separate calls because a real backend would answer them
from separate endpoints, which is what makes that day a change to one module. Against this
fixture it means two identical requests, usually served from the browser cache the second
time. Measured: two requests, 36ms and 47ms.

**Renaming re-runs the list query, request included.** The overlay is part of the query
key, which is what makes search and sort see the new name, and it has the pleasant side
effect that undoing a rename lands back on a result already in the cache. The cost is that a
purely local change creates a new cache entry and a new fetch, usually served from the
browser cache. With a real write endpoint the rename would be a mutation and this goes away.
Against a fixture it is a request that did not need to happen.

**The scrollable table region is always a tab stop.** It carries `tabIndex={0}` so keyboard
users can scroll it, which is correct when it scrolls. On a desktop width it does not
scroll, so it is a focus stop that does nothing. Doing this properly means measuring
overflow with a `ResizeObserver`, which is more machinery than the problem deserves, so it
stays as a known trade-off.

More will be added here as the code is written, because that is when the rest of them appear.

## What I would need before building this for real

The questions I would have asked a product owner, roughly in the order the answers would
change the most work.

**1. Who uses this screen, and what do they do with it every day?** A support agent looking
up one person and an administrator working through the whole list want different layouts.
Right now I am guessing about which fields matter and whether the id should be visible.

**2. How many users are there in reality, hundreds or hundreds of thousands?** This decides
client or server side filtering, pagination against virtualization, and whether local edits
can work at all. See gap 15.

**3. Who owns the visual language?** Is a design coming, is the look permanently my
decision, and does a company design system already exist that I should be using? I would ask
this first, because the answer flips the styling choice completely. With no design, a full
component library like MUI is a benefit, because the visual decisions are already made. With
a design, MUI becomes a cost because I would spend my time overriding it, and a headless
library plus my own styling is right. With an existing company design system, neither
applies and I use that.

**4. Will edits go to a real API?** The whole local versus server decision changes the
moment there is a write endpoint. Until then, local has to win, and that is the missing API
deciding rather than me.

**5. What happens when two people edit the same user at the same time?** Last write wins or
optimistic locking changes the data model and the error handling. And if the other person
has to see the change live, that means a socket, which is a much larger scope than this
screen.

**6. Is the name the only editable field, or the first of many?** A one field form and a ten
field form are different things. If more are coming I would build the edit differently from
the start.

**7. Who is allowed to edit, and do we need roles?** It changes what the interface shows or
hides, and it changes what the API has to return.

**8. Do we need a history of changes, who changed what and when?** An audit trail is a normal
requirement for user management and it affects the data model, not just this screen.

**9. Do we need create and delete?** The screen is called user management, which promises
more than the requirements ask for. I want to know whether that is the next iteration or
deliberately out.

**10. Where does the city list come from, and is the filter single or multiple select?**
Building it from the loaded users breaks the moment the data is paginated. If it is a real
filter it needs its own endpoint.

**11. Should search also cover username, company or phone?** People expect search to find
whatever they typed. Restricting it to two fields is a decision, not an obvious default.

**12. Which browsers, devices and accessibility level do we support?** WCAG AA, screen
readers and older browsers all change the estimate, and I would rather know before the screen
is built than after.

**13. Will we need localisation and right to left?** It affects layout, formatting and the
sorting collation. Far cheaper to know now than to retrofit.

**14. Does this have to work offline?** This is the only question that would make me choose
IndexedDB over `localStorage`, so I want the answer before picking the storage.

## A note on AI

`AI/context.md` is the brief I use when an assistant works in this repo. It was written
before the code, at the same time as this README, and updated once at the end of the day, so
the git history shows it growing with the project rather than being written about it
afterwards.
