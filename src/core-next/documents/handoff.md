# Core Next handoff

- Updated: 2026-07-11
- Branch: `core-next`
- Worktree at handoff: verify before editing

This is the current routing document. Implementation history belongs in Git.

## Next task: remove legacy app functions

The current refactor goal is an independent Core module through which the app
works via a clear Redux adapter API. Continue switching real app consumers from
legacy `5-entities` model functions to `core-next/adapters/redux`, then delete
each legacy function with its last consumer.

The budget/goal and transaction write wrappers are removed. App consumers now
import semantic commands from the Redux adapter; transaction analytics stay at
the UI action boundary. Read, classification, sorting, filtering, and
presentation helpers remain separate migration work.

The legacy model write cutover is complete: production code no longer invokes
write methods through `*Model`. FX local edit/reset are semantic Redux adapter
commands, while HTTP loading is an app feature that dispatches those commands;
the old FX thunk file and unused freeze action are gone.

The `fxRateModel` object and barrel are removed. Direct app consumers use Core
Redux selectors; legacy goal/envBalances/displayCurrency projections import the
old defining selectors directly only while parity paths remain. No Redux
adapter import was added back into that legacy graph.

The legacy displayCurrency model is removed. UI consumers use
`useCoreToDisplay` and `useCoreDisplayCurrency`; legacy accBalances conversion
uses the same Core Redux selector. The display component remains as a thin UI
component, not a state/model boundary.

The `trModel` object and barrel are removed. Type, viewed state, date ordering,
and the type-getter hook are Core Redux exports. Transaction filtering is
temporarily re-exported by the Redux adapter from its defining legacy module;
move that implementation after the remaining legacy transaction projections
are retired.

Account reads/hooks now use granular Core Redux exports: raw and populated
accounts, lists, in-budget and saving subsets, plus debt-account selection.
The populated projection belongs to the Core account read layer and receives
currency metadata explicitly; it is not a recreated legacy model object.

Instrument maps and merchants now also use Core Redux exports. The adapter owns
their direct Redux-slice selectors and derives code maps locally, so neither app
consumers nor adapter wiring import their legacy model objects.

Next take user and user-settings reads as one family. They are the remaining
small reactive preference surface; keep feature-specific goal/envelope helpers
separate rather than creating another catch-all adapter API.

## Verification checkpoint

Start verification now, but do not call the refactor complete yet. The public
baseline proves deterministic demo behavior, Core/Redux parity, invalidation,
command routing, replay, package boundaries, and type safety. In the current
tree after the account and reference-data slices, however, 16 `*Model` calls
remain across 11 page/widget/feature files; recalculate this after every family.
Eight
legacy-parity bridge suites still exist. The opt-in private fixture is not
available in this environment, so large real-account parity is not freshly
verified.

The 2026-07-12 browser smoke verified demo load, transaction navigation and
editing through the Core/Redux command path, a pending outbox entry, persistence
of both the edit and outbox across reload, and no browser console errors. It did
not exercise an explicit remote sync or a budget/goal edit, so those completion
gate items remain open.

The completion gate is: public baseline green; privacy-safe private fixture
green when available; one manual browser smoke of sync plus budget/transaction
editing; and no production dependency on a legacy model API that the new Redux
surface is meant to replace.

The identity materializer stays as the extension point already wired into the
command path, but implementing its domain rules is deferred until after legacy
removal. Building the semantic engine facade is also later work.

## Read order

1. [roadmap.md](./roadmap.md) for the finishing order and Track C rules.
2. [architecture.md](./architecture.md) for dependency and command boundaries.
3. [design-ledger.md](./design-ledger.md) for accepted decisions and risks.
4. [testing.md](./testing.md) for verification and legacy-parity exits.
5. Entity READMEs beside `src/core-next/zenmoney/*` when changing normalized
   ZenMoney behavior.

## Current state

- The root is an internal facade: constants, shared root types, and snapshot
  session only. Engine/outbox operations remain internal.
- Redux is the sole reactive owner of `base + outbox + outboxHead`; `current`
  and sync transport are derived.
- All production writes use semantic adapter commands. The generic command
  executor and legacy patch bridge are not public.
- Local commands store intent and materialized patches. Replay uses the stored
  applied patch and preserves unrelated entity-map references where possible.
- Persisted replica input is versioned and runtime-validated before replay.
- Clean sessions may sync periodically; applied local commands pause periodic
  sync until explicit user synchronization.
- Domain envelopes remain headless; Redux owns localization, symbols, and
  generated/display colors.
- The session facade is frozen; the current supported app surface is the Redux
  adapter. A semantic engine facade comes later.

## Boundaries to preserve

- `src/core-next/index.ts` is the facade-only root.
- `src/core-next/zenmoney` and `src/core-next/zerro` are implementation paths,
  not supported package APIs.
- Core must not import Redux, React, IndexedDB, localization, worker code, or
  app-layer `5-entities`/`6-shared` runtime modules.
- Commands express writable intent; avoid `Partial<TEntity>` contracts.
- `applyPatch` remains dumb. Cross-entity server-like behavior belongs in the
  materializer.
- Canonical server patches bypass local materialization.
- Persist only base timestamp, outbox, and head. Do not persist derived
  `current`, sync transport, or response staging.

## Accepted product risks

These are recorded in [design-ledger.md](./design-ledger.md) and should not be
re-litigated during legacy removal unless new evidence changes the requirement:

- account balances may remain stale until synchronization;
- dirty sessions pause remote pulls until explicit sync;
- undo/redo semantics exist without a production UI;
- replica metadata is disposable; migrations are not required without a
  concrete continuity need.

## Verification baseline

For every legacy cutover, verify its last real consumers, switch them to a
narrow Redux adapter export, delete the obsolete function, and retain parity or
invalidation coverage appropriate to that read/write path.

Before committing a slice, run:

```bash
pnpm exec vitest run <focused tests>
pnpm exec vitest run
pnpm exec tsc --noEmit
pnpm core-next:package-check
git diff --check
```

The full repository Prettier check currently reports pre-existing drift outside
Core Next; changed files must still pass Prettier.
