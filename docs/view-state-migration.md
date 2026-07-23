# Transient view-state and Redux surface cleanup plan

- Status: complete
- Created: 2026-07-23
- Scope: session-only application view state, beginning with the main
  transactions page, followed by bounded cleanup of the app-facing Redux API
- Explicit non-goals: replacing Redux, changing the Core replica, persisting
  view state across reloads, moving every component-local value into Redux, or
  mechanically removing every `dispatch`/thunk in one migration

## Outcome

Introduce one non-persisted Redux `view` slice for screen state that must
survive navigation within the current login session but should reset on reload
and logout.

The first consumer is the main transactions page. Its filter query, immediate
search text, and top visible date move from the module-level `viewMemory` map to
`state.view.transactionsPage`. The reusable transaction-list drawers keep
ephemeral local state, do not inherit the page's remembered state, and reset
filters, search, and scroll whenever the side panel is closed and opened again.

After that behavior is stable, simplify the Redux surface without changing its
ownership:

- infer `AppDispatch` from the configured store and use modern pre-typed hooks;
- represent one sync lifecycle with one `sync` slice instead of independent
  `isPending` and `lastSync` slices;
- bind the transactions-page view state behind a typed hook so the page does
  not dispatch storage actions directly;
- provide one generic typed `useAppCommand` bridge for semantic thunks and
  validate it on one feature before considering wider adoption;
- keep Redux explicit inside orchestration, middleware, and tests where
  `dispatch` is useful rather than hiding it as a blanket style rule.

The migration must preserve current behavior:

- leaving `/transactions` and returning restores filters, search, and scroll;
- a full reload starts with the default view;
- logout clears the remembered view before another account can use it;
- search remains debounced by 300 ms for query execution;
- scroll restoration stores a semantic top date, not a pixel offset;
- an explicit `initialDate` jump wins over the remembered top date;
- transaction selection, menus, filter editors, and other component-local UI
  state still reset when their component unmounts;
- transaction lists opened in account/envelope/global side panels always start
  fresh on each open, apart from an explicit caller-provided `initialQuery` or
  `initialDate`.

## Why this belongs outside Zerro Core

The Core replica is authoritative product state: normalized server data,
durable command outbox, session-only redo, and derived `current`. Filters and
scroll position are presentation state. They must not enter the Core command,
materialization, sync, or replica-persistence contracts.

The application already uses Redux as its reactive runtime owner. A small
unpersisted slice gives view state typed access, subscriptions, DevTools, and an
explicit reset without introducing Zustand or another reactive owner.

This plan establishes the following state placement rule:

| Lifetime and meaning                          | Owner                                     |
| --------------------------------------------- | ----------------------------------------- |
| Only while one component is mounted           | React `useState` / `useReducer`           |
| Across navigation, reset on reload/logout     | Redux `view` slice                        |
| Shareable or browser-history navigation state | URL search parameters                     |
| Across reloads                                | An explicit local-storage/IndexedDB owner |
| Domain data, sync, undo/redo                  | Core replica in Redux                     |

## Current implementation

The current session memory is a process-wide untyped map:

```text
src/6-shared/helpers/viewMemory.ts
```

The main page opts into it by passing
`storageKey="transactionsPage"` from:

```text
src/2-pages/Transactions/index.tsx
```

`TransactionList` stores non-search query clauses and immediate search under
two derived string keys. `GrouppedList` stores the top visible date under a
third key. The approach has the right lifetime, but it has no reactive
subscription, no schema attached to a key, no logout reset, and makes a generic
widget own a hidden storage policy.

Only the main transactions page currently passes `storageKey`. The global and
envelope transaction drawers use `TransactionList` without it. They are
intentionally outside session memory: closing a drawer must discard its local
filters, search, and scroll even if the surrounding global drawer host remains
mounted.

## Target state and public operations

Start with a single file because there is only one view-state consumer:

```text
src/store/view.ts
```

Split it into `src/store/view/*` only when a second substantial page state makes
the single file hard to scan. Do not build a generic registry or dynamic reducer
framework in advance.

Target shape:

```ts
type TTransactionsPageView = {
  /** Non-search clauses. Immediate search remains a separate field. */
  query: core.transactions.TTransactionQuery
  search: string
  topDate: TISODate | null
}

type TViewState = {
  transactionsPage: TTransactionsPageView
}
```

Use a type-only import from the explicit `zerro-core/redux` adapter surface for
the query type. Do not deep-import a Core implementation path. Typecheck the
import before widening any public Core exports; the view slice must not create
a runtime `store -> zerro-core/redux -> store` cycle.

The slice should expose only scoped operations:

```ts
patchTransactionsPage(Partial<TTransactionsPageView>)
resetViews()
selectTransactionsPageView(rootState)
```

Defining `selectors` inside `createSlice` is preferred for this small slice.
Do not add a generic `set(path, value)` action: it would trade a few lines for
weaker types and opaque DevTools events.

Register the reducer as `state.view` in `src/store/index.ts`. Do not add it to
`replicaPersistenceMiddleware`; the existing exact action matcher should remain
limited to replica mutations.

## Target component ownership

`TransactionList` remains reusable, but persistence becomes explicit at its
caller boundary.

Extract a small view-state contract accepted by the list:

```ts
type TTransactionListView = {
  query: core.transactions.TTransactionQuery
  search: string
  restoredTopDate: TISODate | null
  onQueryChange: (query: core.transactions.TTransactionQuery) => void
  onSearchChange: (search: string) => void
  onTopDateChange: (date: TISODate) => void
}
```

The exact name may change, but preserve these properties:

- it is a typed object, not a storage key;
- `Filter` receives values and semantic callbacks rather than
  `Dispatch<SetStateAction<...>>` where practical;
- the main page binds the contract to the Redux `view` slice;
- drawer callers supply or create a fresh local controller for each open
  lifecycle; key/remount the list by drawer-open identity if the MUI container
  keeps its children mounted through close;
- `GrouppedList` keeps `scrollTop` locally for its pinned-header rendering, but
  reports only changes to the top visible date to the external controller;
- avoid dispatching on every scroll pixel. Compare the new visible date with
  the previous one before updating Redux.

`initialDate` is an imperative navigation request and remains a prop. On mount
or change, it takes precedence over `restoredTopDate`, matching current
behavior.

## Target Redux surface

The cleanup is about reducing incidental Redux syntax at app/UI boundaries,
not concealing state transitions or inventing a second service layer.

### Store and hook types

Keep store construction in `src/store/index.ts`, but infer its public types from
the configured value:

```ts
export type AppStore = typeof store
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
```

Retain the `AppThunk<TResult>` alias while real feature and orchestration
thunks use it. Remove the hand-built `ThunkDispatch<RootState, any,
UnknownAction>` type, `TypedUseSelectorHook`, and their imports. This removes
the current `any` and lets middleware changes flow into `AppDispatch`
automatically.

Do not move hooks to a new file merely to copy a template. Split
`src/store/hooks.ts` only if a real runtime cycle appears or store setup becomes
hard to scan. Preserve the current `import { useAppSelector } from 'store'`
surface during this wave to avoid a mechanical whole-repository import churn.

### Sync lifecycle

Replace `state.isPending` plus `state.lastSync` with one `state.sync` owner:

```ts
type TLastSyncResult = {
  finishedAt: number
  isSuccessful: boolean
  errorMessage: string | null
}

type TSyncState = {
  status: 'idle' | 'pending'
  lastResult: TLastSyncResult | null
}
```

The slice should expose semantic lifecycle actions and colocated selectors:

```ts
syncStarted()
syncFinished(TLastSyncResult)
selectIsSyncPending(rootState)
selectLastSyncResult(rootState)
```

Keep `syncData` as the orchestration thunk for this migration. It captures the
sent outbox prefix, coordinates remote sync, applies the canonical response,
saves local data, and emits analytics; converting that flow to
`createAsyncThunk` at the same time would mix two independent refactors.

The thunk must settle sync state on every path. Use `try`/`catch`/`finally` or
equivalent explicit control flow so a thrown transport or persistence error
cannot leave `status: 'pending'`. Preserve the current resolved API-error
handling and do not alter the sent-prefix acknowledgement rules.

### Hiding dispatch at UI boundaries

The transactions page should consume a feature hook rather than assemble
Redux calls itself:

```ts
const view = useTransactionsPageView()

<TransactionList view={view} />
```

`useTransactionsPageView` owns selectors, dispatch, scoped actions, and stable
callbacks. It returns the typed transaction-list view contract described
above. Keep the hook next to the transactions page or its view model; do not
put feature semantics into a generic shared hook.

For existing semantic thunks, add one generic adapter:

```ts
export function useAppCommand<TArgs extends unknown[], TResult>(
  command: (...args: TArgs) => AppThunk<TResult>
) {
  const dispatch = useAppDispatch()
  return useCallback(
    (...args: TArgs) => dispatch(command(...args)),
    [command, dispatch]
  )
}
```

This changes component syntax from:

```ts
const dispatch = useAppDispatch()
dispatch(core.envelopes.rename(id, name))
```

to:

```ts
const renameEnvelope = useAppCommand(core.envelopes.rename)
renameEnvelope(id, name)
```

Use this bridge only for stable semantic command creators. Do not make it
accept arbitrary actions, action objects, callbacks, or store paths. Plain
Redux actions in Redux-aware orchestration may continue to use `dispatch`.

Avoid generating one `useRename`, `useRemove`, or `useSetColor` wrapper per
command in `zerro-core/redux`; that would replace visible dispatch calls with a
larger repetitive hook surface.

## Implementation waves

### W1 — Add the unpersisted view slice — complete

Files:

- create `src/store/view.ts`;
- update `src/store/index.ts`;
- update `src/4-features/authorization.ts`;
- create `src/store/view.test.ts`;
- update `src/store/data/replicaPersistence.test.ts`;
- add a focused authorization test if no existing test can cover logout reset.

Work:

1. Define the initial transactions-page view.
2. Add scoped patch, reset, and selector APIs.
3. Mount the reducer under `view`.
4. Dispatch `resetViews()` during logout alongside `resetData()` and token
   clearing. The reset must happen for explicit logout and for the pre-login
   logout path.
5. Verify that replica persistence does not react to view actions.

Focused tests:

- initial state has no clauses, empty search, and `topDate: null`;
- patching one property preserves the other properties;
- reset returns the exact default view;
- a view action does not schedule a replica-persistence write;
- logout resets view state. Prefer extending an existing authorization test if
  one provides a focused runtime; otherwise test the thunk with a small store.

Suggested commit:

```text
refactor(store): add transient view state
```

### W2 — Move the transactions page off `viewMemory` — complete

Files expected to change:

- `src/2-pages/Transactions/index.tsx`;
- `src/3-widgets/transaction/TransactionList/index.tsx`;
- `src/3-widgets/transaction/TransactionList/GrouppedList.tsx`;
- `src/3-widgets/transaction/TransactionList/TopBar/Filter.tsx`;
- focused transaction-list/view tests.

Files expected to be removed when no references remain:

- `src/6-shared/helpers/viewMemory.ts`.

Work:

1. Bind the main page to `selectTransactionsPageView` and
   `patchTransactionsPage`.
2. Replace `storageKey` with the explicit typed view contract.
3. Keep the raw search field immediate and derive the applied search clause
   from the existing 300 ms debounced value.
4. Replace `loadMemory` scroll restoration with `restoredTopDate`.
5. Replace `saveMemory` in the scroll handler with `onTopDateChange`, emitted
   only when the semantic visible date changes.
6. Preserve `initialDate` precedence and the existing next-frame
   `react-window` positioning behavior.
7. Confirm both drawer callers use fresh local query/search/scroll state, do not
   share the main page's Redux state, and reset on close/reopen. Do not rely on
   MUI's current unmount implementation for this product behavior; give the
   list an explicit open-cycle identity or reset boundary.
8. Remove `viewMemory` and `storageKey` only after `rg` shows no remaining
   consumers.

Focused behavior coverage:

- a transactions-page remount with the same store restores query and search;
- a new store (reload equivalent) starts from defaults;
- a stored top date is used after the virtual list is ready;
- `initialDate` overrides a stored top date;
- repeated scroll events within one date do not repeatedly patch Redux;
- a drawer list starts from its provided `initialQuery`, does not read the page
  view, and returns to that initial state after close/reopen;
- immediate search text and debounced applied query remain separate.

Suggested commit:

```text
refactor(transactions): move page memory to view state
```

### W3 — Modernize store and hook typing — complete

Files:

- update `src/store/index.ts`;
- update focused type tests only if the repository already has an appropriate
  compile-time contract location.

Work:

1. Add `AppStore = typeof store`.
2. Derive `RootState` and `AppDispatch` from `AppStore`.
3. Replace the manually parameterized hook wrappers with
   `useDispatch.withTypes<AppDispatch>()` and
   `useSelector.withTypes<RootState>()`.
4. Remove `ThunkDispatch`, `TypedUseSelectorHook`, and the `any` in the current
   public dispatch type.
5. Retain `AppThunk` and the existing root import surface.
6. Do not reformat or migrate unrelated store consumers.

Verification emphasis:

- thunks returning receipts still infer their dispatch return type;
- async authorization and sync thunks remain dispatchable;
- selector result types remain inferred at component call sites;
- typecheck and lint pass without casts added to consumers.

Suggested commit:

```text
refactor(store): modernize typed hooks
```

### W4 — Consolidate sync status — complete

Files expected to change:

- create `src/store/sync.ts`;
- remove `src/store/isPending.ts`;
- remove `src/store/lastSync.ts`;
- update `src/store/index.ts`;
- update `src/4-features/sync.ts`;
- update sync-status consumers such as refresh/navigation/regular-sync UI;
- update focused sync tests.

Work:

1. Introduce `status` plus nullable `lastResult` and colocated selectors.
2. Replace `setPending` and `setSyncData` with `syncStarted` and
   `syncFinished`.
3. Update all consumers in the same commit; do not keep deprecated selector or
   action aliases after the cutover.
4. Ensure thrown failures settle the status and store a bounded error message
   without placing raw error objects in Redux.
5. Preserve the current ordering of outbox preparation, sent-prefix capture,
   request, canonical response application, local save, and analytics.
6. Keep concurrent-sync behavior unchanged; do not add cancellation, request
   ids, or deduplication without a separate product/runtime decision.

Focused coverage:

- initial sync state is idle with no result;
- start preserves the previous result while marking pending;
- successful, API-error, and thrown-error paths all return to idle;
- the last result records the correct success flag, finish time, and safe
  message;
- existing sent-prefix/in-flight-command sync tests remain unchanged and green.

Suggested commit:

```text
refactor(sync): consolidate lifecycle state
```

### W5 — Add and validate the semantic command hook — complete

Files:

- add `useAppCommand` beside the existing typed store hooks;
- add a focused hook/type test if runtime behavior is not already covered;
- migrate one bounded UI feature with existing behavioral tests.

Pilot scope:

Choose one cohesive surface with several direct semantic command dispatches,
preferably transaction preview or one envelope-editing surface. Do not select
files merely to maximize the number of replaced lines. The pilot must include
at least one command returning a receipt/value if such a covered consumer is
available; otherwise explicitly record that return-type inference remains
verified by typecheck only.

Work:

1. Implement the generic hook with stable callback identity.
2. Replace `useAppDispatch` plus `dispatch(core.<domain>.<command>(...))` only in
   the chosen feature.
3. Leave analytics and multi-step UI orchestration at the boundary that owns
   them; hiding dispatch must not move product events into Core commands.
4. Compare the resulting code honestly. If the feature becomes less readable
   or requires casts/wrappers, revert the pilot and keep explicit dispatch.
5. Do not launch a repository-wide migration in this wave.

Exit decision:

- if the pilot clearly reduces ceremony and preserves type inference, future
  feature work may adopt `useAppCommand` opportunistically;
- if it only renames `dispatch` without improving ownership, remove the helper
  and keep the current explicit convention.

Suggested commit, only if the pilot succeeds:

```text
refactor(store): add semantic command hook
```

## Verification

Run focused tests while editing, then the broad gates because this migration
touches store setup, logout, and a virtualized UI:

```bash
pnpm exec vitest run src/store/view.test.ts
pnpm exec vitest run <focused transaction-list tests>
pnpm exec vitest run <focused sync and command-hook tests>
pnpm typecheck
pnpm exec eslint <touched source files> --max-warnings 0
pnpm exec prettier --check <touched files>
pnpm exec vitest run
pnpm zerro-core:package-check
git diff --check
```

The Core package check matters even though no Core behavior should change: the
view-state type must use an allowed public adapter boundary and must not create
a reverse dependency.

Complete a real browser smoke before the W2 commit:

1. open `/transactions`;
2. add at least two filters and enter search text;
3. scroll to an older visible date;
4. navigate to another page and back;
5. confirm filters, raw search text, filtered results, and scroll are restored;
6. open transaction lists from the account/envelope drawers and confirm they do
   not inherit the page filters;
7. change a drawer's filters/search/scroll, close it, reopen it, and confirm it
   starts fresh from the caller's `initialQuery`/`initialDate`;
8. reload and confirm the main page returns to defaults;
9. set view state again, logout, log back in or load demo data, and confirm the
   old view is gone;
10. inspect the browser console throughout; no React, Redux, or virtual-list
    warnings are acceptable.

Before the W4 commit, smoke one successful sync and one available failure path;
confirm pending UI enters and leaves correctly, the previous result remains
visible while pending, commands appended in flight are preserved, and the
console has no new errors. Before the W5 commit, exercise every command changed
by the pilot and confirm its result/receipt, analytics, and visible behavior are
unchanged.

## Acceptance criteria

- `state.view.transactionsPage` is the only session-memory owner for the main
  transactions page.
- No transaction filter, search, or scroll value enters Core replica storage,
  local storage, or IndexedDB.
- `viewMemory.ts`, `loadMemory`, `saveMemory`, and the `storageKey` prop are gone
  if no unrelated consumer appears during implementation.
- Main-page navigation restore, reload reset, and logout reset all match their
  specified lifetimes.
- Drawer lists are independent and discard filters, search, and scroll on every
  close/reopen cycle while honoring explicit initial inputs.
- Scroll persistence remains date-based and does not dispatch for every pixel.
- Search remains immediate in the input and 300 ms debounced for expensive
  transaction query execution.
- `AppDispatch` is inferred from the configured store, typed hooks use
  `.withTypes`, and no `any` remains in the public dispatch type.
- One `sync` slice owns pending and last-result state, and every completion or
  failure path returns it to idle without changing replica acknowledgement.
- The transactions page consumes a typed view controller without direct view
  action dispatches.
- `useAppCommand` is retained only if a bounded pilot demonstrates clearer UI
  ownership with preserved return types and stable callbacks.
- Focused tests, typecheck, full Vitest, package boundary check, formatting,
  diff check, browser behavior, and browser console are green.

## Deferred follow-ups

Do not mix these into the bounded waves above:

- deciding whether transaction filters should be serialized into the URL;
- adding remembered state for other pages;
- replacing Redux with Zustand, Nano Stores, or a custom external store;
- converting `syncData` to `createAsyncThunk` or RTK Query;
- mechanically converting every UI dispatch to `useAppCommand`;
- extracting all feature thunks into a new application-service framework;
- changing Core commands, projections, materialization, sync, or persistence.

After a second page needs session-only state, review whether `src/store/view.ts`
is still readable. Split by page ownership then, based on real consumers, while
keeping one mounted `view` namespace.
