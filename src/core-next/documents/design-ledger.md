# Core Next design ledger

- Updated: 2026-07-11
- Purpose: keep settled decisions, unresolved questions, and temporary bridges
  in one place.

## Settled decisions

### Package boundary

- Core Next is an internal app module, not a published package, until a real
  external or headless consumer exists.
- The root `core-next` entrypoint is the semantic facade: constants, shared
  root types, and the snapshot session only.
- The reference engine (`createZerroEngine`) and its outbox primitives are an
  internal implementation detail. Root no longer re-exports them; the Redux
  slice imports `core-next/engine/*` directly. The `api-boundary` test pins the
  facade-only root, including no `./engine` re-export.
- `core-next/zenmoney` and `core-next/zerro` are internal migration paths, not
  supported app-facing APIs.
- Redux selectors and commands use an explicit adapter entrypoint and are not
  re-exported from root.
- Production Core imports no runtime values from app layers or `6-shared`.

### Facade and reads

- Public reads are grouped by domain and use implemented `get*` names, for
  example `session.envelopes.getAll()`.
- A session represents one immutable snapshot and memoizes each internal node
  once.
- Redux owns cross-snapshot memoization and keeps selectors granular.
- Internal graph nodes need not appear on the semantic root facade.
- `facade/readGraph.ts` is a declarative specification for humans, not runtime
  configuration or a code-generation source.
- Its dependency edges intentionally duplicate explicit wiring in the
  session/future engine and Redux adapter because those runtimes have different
  memoization and reactivity needs. This duplication is accepted; introduce a
  graph framework only in response to demonstrated wiring defects.
- Flat `session.read.*` is deprecated compatibility until parity and fixture
  consumers move.

### Domain and presentation

- Domain envelopes and presentation envelopes are different contracts.
- Localization, generated appearance, emoji, SVG URLs, and bank logos are not
  domain state.
- Reusable appearance policy and catalogs may live in an optional presentation
  package or package subpath with adapter-provided localization/assets.
- Write commands resolve against domain envelopes, never decorated views.
- The Redux command adapter maps localized default-group labels back to stable
  domain ids before compilation.

### Commands, materialization, and replay

- Commands use narrow semantic inputs instead of `Partial<FullEntity>` or
  `Partial<Projection>`.
- Singular commands are the default; bulk APIs are added only with explicit
  atomicity and error semantics.
- Command compilers produce intent patches.
- Every local patch passes through `materializePatch`; the first implementation
  is identity-only.
- The identity materializer is a useful extension point, but server-like rules
  are not a goal of the current refactor. Keep it identity-only until remaining
  legacy app functions are removed; domain-rule work happens afterward.
- Canonical server diffs bypass local materialization.
- The outbox stores `command`, `intentPatch`, `appliedPatch`, and
  `materializerVersion`.
- Replay uses stored `appliedPatch`; it does not recompile commands or
  rematerialize history.
- Dumb `applyPatch` applies only explicit changes.

### Replica and conflicts

- Redux remains the sole reactive replica owner in the React app.
- The in-memory engine is a reference/headless primitive, not the current app
  API. Build the semantic engine facade only after the Redux adapter cutover;
  do not run a parallel engine store beside Redux.
- Undo/redo move `outboxHead`; inverse patches are not stored.
- The durable logical replica is exactly `base`, `outbox`, and `outboxHead`;
  `current` and request-local sync transport are derived.
- Periodic sync runs only when the applied outbox prefix is empty. The first
  local command pauses it until explicit user synchronization.
- Manual sync is a commit boundary: discard the redo tail, send the applied
  prefix, accept a successful ZenMoney response as canonical, remove all sent
  entries, and replay only entries created while the request was in flight.
- A successful response is treated as acceptance of the complete sent batch;
  per-command acknowledgement is not required in the first implementation.
- There is no product inbox or incoming-change history. Temporary Redux response
  staging is an internal implementation detail and is not durable state.
- First-stage conflict resolution is entity-level last write wins, including
  hidden-data blobs.

### Accepted product risks

- Stale account balances are accepted. The transaction `effects.ts` balance
  update was removed with the intent-only transaction slice; recomputing
  `account.balance` is a materializer (Track C) concern. Because periodic sync
  is paused in a dirty session, the stale window is now visible until manual
  sync. This is intentional, not a defect to patch before Track C.
- The dirty-session sync pause is accepted. A session with applied outbox
  entries does not pull remote changes until the user syncs manually, even
  though the rebase machinery could support more. This is the first product
  policy; revisit only for real multi-device demand.
- Undo/redo semantics stay without a production UI control. The outbox already
  implements and tests them; a UI affordance is a later slice, not premature
  complexity to remove.

### Current refactor target

- The application should access Core behavior through clear, narrow exports
  from `core-next/adapters/redux`.
- Remaining legacy model functions are migration wrappers, not the desired
  final app API. Switch their real consumers and delete each wrapper when its
  last consumer moves.
- Materializer domain rules and the semantic engine facade are explicitly later
  work; their existing seams may remain inert during this cutover.

### Testing

- Use focused unit tests for domain rules and contracts.
- Use deterministic demo data for representative public graph regressions.
- Use private fixtures only for opt-in high-confidence parity.
- Private failures compare hashes or safe summaries, never raw objects.
- Trivial map-lookup tests are low value unless they protect extra semantics.

## Open questions

### Package surface

Decided and implemented: Core Next is an internal app module; root is
facade-only and no longer re-exports the engine (see Package boundary above).
The remaining open questions concern a future published package, not current
work:

1. Which supported subpaths should exist besides root and the Redux adapter?
2. Are `demo`, `testing`, `materializer`, and future `presentation` official
   package entrypoints or repo-local adapter SPI?
3. When should package `exports` and generated declaration consumer tests
   enforce the boundary?

### Presentation package

1. Should appearance policy and binary/vector assets ship in one package or in
   separate `presentation`, `tag-icons`, and `bank-logos` subpaths?
2. Should SVGs be inline strings, URLs, imported modules, or adapter-resolved
   handles?
3. How should unknown tag icon and bank company ids degrade?

### Materializer and sync

1. Once materialization is non-identity, should ZenMoney sync send
   `intentPatch`, `appliedPatch`, or use a per-command transport encoder?
2. Which real ZenMoney responses should become parity fixtures for account
   deletion and transfer conversion?
3. When rules change, do pending entries keep old applied effects until replay,
   or require an explicit outbox migration?

### Replica

1. What is the minimum public command set for the first Redux-backed engine?
2. When the persisted shape eventually changes, is retaining a reader for the
   previous outbox format sufficient, or does a real migration become useful?
3. Should base domains and outbox metadata eventually share one IndexedDB
   transaction, or is recovery by the next canonical sync sufficient?

### Demo data

1. Is `makeDemoStore` enough, or should demo expose a ready engine/runtime?
2. Which distinct scenarios justify maintenance: sparse history,
   multi-currency savings, debt-heavy data, or malformed hidden data?

## Active compatibility bridges

### `src/demoData`

Status: thin wrapper over `core-next/demo`.

Exit when app and story consumers import the supported demo entrypoint or an
app-specific adapter.

### `6-shared/types`

Status: compatibility facade re-exporting Core-owned normalized entities,
store/patch shapes, and `DataEntity`.

Exit gradually as app/domain consumers use supported Core types. Do not perform
a big-bang type move.

### Deep implementation imports

Status: migration debt.

Current examples include app or compatibility imports from:

```txt
core-next/zenmoney
core-next/zenmoney/users/types
core-next/zerro/goals
core-next/patch
```

Exit one consumer at a time after its semantic root or adapter API exists.
Do not solve this by exporting entire internal barrels from root.

The Redux adapter now explicitly owns reminder set/delete, data-account
preparation, the debug patch hook, and tag presentation compatibility exports.
Their former deep app imports are resolved; this does not make the underlying
ZenMoney/Zerro implementation barrels public.

Goal normalization/type checks and transaction classification are also exposed
as narrow Redux-adapter helpers for their existing app consumers. Production
app sources are guarded against importing implementation subpaths; the
`6-shared/types` compatibility facade remains the documented exception.

### Legacy tag icon files

Status: `core-next/tag-icons` owns package-safe emoji metadata, while
`6-shared/tagIcons.json` and `6-shared/tagIconsSvg.ts` remain compatibility and
app-asset sources.

Exit after the presentation-package decision and consumer migration. Concrete
SVG URLs must remain outside domain Core.

### Replica storage

Status: Redux `current` replays from `data.base` plus the applied runtime outbox
prefix. Sync transport, changed count, and pending-change time derive directly
from that prefix; Redux no longer stores `data.diff`.

Canonical responses may stage temporarily through `data.inbox`, but this is
not a product inbox and is never persisted. Rebase removes the exact entry ids
sent in the request and preserves later applied entries; non-sync loads
without sent-entry metadata replace the base and clear local history.

`prepareClientSync` now enforces the commit boundary before payload capture: it
drops the redo tail and persists the chosen applied branch. Request metadata is
named `sentOutboxIds`; successful batch acceptance is inferred from the
canonical ZenMoney response rather than represented as per-entry server
acknowledgement.

Replica persistence uses a separate versioned IndexedDB key rather than adding
metadata to ZenMoney entity keys. Version 1 stores base server timestamp,
outbox, and head only; `current`, transport, and response staging are
derived/ephemeral. Reload
replays only when the persisted base timestamp matches the loaded server base;
missing, stale, or unknown snapshots fall back to an empty outbox.

Cross-key crash consistency and replica migrations remain deferred until a
concrete failure or format change requires them. The logical durability contract
is still `base + outbox + outboxHead`; unknown pending outbox data must not be
treated as casually disposable user state.

The documented manual-sync commit boundary, outbox-derived transport, and
explicit base naming are implemented. Resolve the intent/applied transport
question before enabling non-identity rules.

## Resolved bridges

### Transaction write wrappers

Resolved on 2026-07-11. Transaction context menus, bulk actions, lists, and the
preview call semantic Redux adapter commands directly for delete, permanent
delete, restore, viewed state, update, recreate, and bulk edit. The legacy
transaction thunk file and `trModel` write members are removed. Tracking events
remain at the UI action boundary; transaction reads, classification, sorting,
filtering, and presentation helpers are not part of this resolved bridge.

### Budget and goal write wrappers

Resolved on 2026-07-11. Budget features and GoalPopover call the narrow Redux
adapter `setBudget` / `setGoal` commands directly, and `TBudgetUpdate` is
exported from that adapter. The legacy `budgetModel.set` and `goalModel.set`
members, their source files, and wrapper-local tests are removed; command
routing coverage lives beside the adapter.

### Legacy local diff

Resolved on 2026-07-11. Redux no longer stores or maintains `data.diff`.
`getPendingSyncDiff` merges the applied outbox prefix for the request payload
and pending-count UI, while the before-unload timestamp derives from applied
entry `createdAt` values. Undo, redo, restore, rebase, and prepare-sync therefore
have only one authoritative pending representation.

### Redux server name

Resolved on 2026-07-11. Runtime Redux state now calls the accepted snapshot
`data.base`; reducers, local save, persistence snapshots, test builders, and
fixtures no longer use `data.server`. The IndexedDB record shape is unchanged:
it still anchors outbox metadata with `baseServerTimestamp`.

### Direct Redux client patches

Resolved on 2026-07-11. Reminder create/update/delete uses semantic reminder
commands through a cycle-safe executor; hidden data-account creation uses the
Core account compiler with an explicit infrastructure command; and the debug
patch API appends an explicit infrastructure entry. No production caller
dispatches `applyClientPatch` directly. The bypassing action/export was removed
when Redux replay became authoritative.

### Legacy patch command

Resolved on 2026-07-11. After the account merge migration removed the final
production consumer, the `legacy.patch` command, `applyLegacyPatch` thunk and
adapter export, source file, and bridge-only tests were deleted. The Redux
adapter command export list is pinned by `api-boundary.test.ts`.

### Envelope partial-patch command

Resolved on 2026-07-10. The semantic structure slice removed the last app
consumer; the retire slice then deleted `envelopeModel.patchEnvelope`, the
`zerro.envelope.patch` command, and app-layer `TEnvelopeDraft` exports.
Envelope drafts remain internal to Core compile functions.

### `populatedTags` session dependency

Resolved on 2026-07-10. Sessions build domain envelopes from normalized Core
tag structure; the Redux adapter decorates them afterward. Envelope commands
resolve against the domain selector.

### Production `6-shared/helpers` imports

Resolved on 2026-07-10. Core owns its internal date, money, key, color, and
utility implementations. `api-boundary.test.ts` protects this direction.

## How to update this ledger

- Move an answer from Open Questions to Settled Decisions when the choice is
  explicit and implemented or accepted.
- Remove a compatibility bridge only in the slice that removes its last real
  consumer.
- Record the exit condition, not a vague intention to clean it up later.
- Keep chronological implementation detail in Git, not here.
