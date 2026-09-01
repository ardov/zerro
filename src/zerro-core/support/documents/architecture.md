# Zerro Core architecture

- Status: accepted architecture; the migration it guided is closed
- Updated: 2026-08-22

## Purpose

Zerro Core extracts Zerro and normalized ZenMoney behavior into a module that
can run in the current React/Redux app, a worker, a local server, tests, or a
future local-only runtime. The module is not a storage layer and does not own
UI reactivity. It provides pure domain operations plus facades that runtimes
can adapt.

Near-term non-goals: solving memory pressure for the largest accounts; rich
field-level remote conflict previews; replacing Redux with a second reactive
Core store; publishing a standalone package before its API stabilizes.

## Boundaries

Dependency direction is one-way, and Core must not import back from adapters
or app layers:

```txt
shared primitives
  -> normalized ZenMoney entities and operations
  -> Zerro hidden data and domain behavior
  -> projections and materializer
  -> facade (snapshot session, command compilers)
  -> runtime adapters (Redux, persistence, sync, UI)
```

## Change pipeline

Core persists requested changes and derives their complete local effects:

```txt
base + durable outbox -> materialized patches -> current
base + durable outbox -> fresh transport patch
current               -> derived views
```

### Commands

This section is the single canonical specification of the persisted command
shape; other documents reference it and must not restate it.

Durable commands describe sparse user intent and remain serializable. The
outbox stores one command shape directly:

```ts
type Command = {
  type: 'patch'
  issuedAt: TMsTime
  patch: IntentPatch
}

type IntentPatch = {
  user?: UserPatch[]
  account?: AccountPatch[]
  merchant?: MerchantPatch[]
  tag?: TagPatch[]
  budget?: BudgetPatch[]
  reminder?: ReminderPatch[]
  reminderMarker?: ReminderMarkerPatch[]
  transaction?: TransactionPatch[]
  deletion?: DeleteIntent[]
}
```

This list is closed. Reference and server-owned families such as instruments,
countries, and companies are not command intent. Users and reminder markers are
command intent only through their explicitly writable fields; user intent is an
update to the signed-in root user, and billing and subscription fields remain
excluded. The issue and persistence boundaries reject other `TNormalizedPatch`
members instead of implicitly inheriting them. There is no outbox-entry wrapper,
entry id, durable command union, or persisted materialized patch.

Entity patch types live beside their entity types and document locally writable
fields through `EntityPatch<TEntity, TWritableFields>`. The helper makes `id`
required and only the explicitly listed writable fields optional. A present id
is patched and a missing id is created. This upsert rule deliberately favors one
simple command shape over separate create/update operations.

Command issue captures generated ids, `issuedAt`, and every other
nondeterministic input. Replay must not call ambient time or generate a new id.
Deletion intent stores entity identity; materialization adds protocol metadata.

Commands set absolute values and must be idempotent under rebase. Semantic Redux
verbs may use different compilers, but they all issue this persisted patch
shape. Relative requests such as toggle or increment are resolved to absolute
values before issue.

If compilation generates caller-only metadata, it returns
`{ patch: TIntentPatch, receipt: TReceipt }`. The receipt is not replay state.

Internal compilers keep the `compile*` prefix; runtime namespaces expose short
domain verbs such as `envelopes.rename(id, name)`.

### Materialization

Local writes pass through one deterministic pipeline:

```txt
base
  -> expand sparse primary intent
  -> derive predicted server effects
  -> applyPatch(primary + effects)
  -> repeat for the next command
  -> current
```

Sparse patches read the latest entity and overlay only present fields. A missing
id invokes the entity factory and creates a complete entity; an incomplete
creation intent fails before it can be persisted. Patching an entity that
disappeared remotely therefore recreates it after rebase. Command order resolves
delete-then-patch and repeated field writes.

Predicted server rules belong here rather than in command compilers. Their
content — which effects Core predicts, which the server owns, and where the two
deliberately differ — is specified in [materialization.md](./materialization.md).

Each entity module owns its writable, required, and creation field contracts
next to its factory; the application materializer holds the command loop and
one registry row per entity. Materialization is pure and receives the current normalized snapshot, command,
and explicit version time. Local replay uses `issuedAt`; request transport uses
a fresh `sentAt`. Local `current` contains primary changes plus predicted
effects. Transport is built from a separate primary-only replay so predicted
server effects are never sent as client intent.

### Dumb patch application

`applyPatch` performs only the changes explicitly present in an applied patch.
It must not discover cascades, call external services, or interpret commands.
Canonical server diffs bypass local materialization because ZenMoney may have
already expanded the same effects.

## Public facade

The root entrypoint (`import { createZerroSession } from 'zerro-core'`) is the
package-facing semantic surface. It must not re-export Redux adapters or whole
implementation trees. The outbox engine operations are internal and are not
root exports; the current Redux store and worker reach them through the explicit
`zerro-core/replica` integration entrypoint. Implementation paths behind that
entrypoint are not stable APIs.

The React app uses one explicit Redux adapter entrypoint grouped by domain
(`import { core } from 'zerro-core/redux'`).
The namespaces contain granular selectors, hooks, semantic command creators,
and their domain types. They do not own state or read the Redux store
imperatively. Flat adapter exports are intentionally unsupported. Each Redux
domain module owns its selector implementations and hook wrappers; there is no
shared selector or hook barrel. `runtime/redux/state.ts` owns only `selectData`,
the path from `RootState` to the complete Core snapshot. Each domain namespace
owns its `selectAll`/`selectRaw` narrowing selector, and downstream selectors
depend on that stable entity-map reference. Command-time derived reads use
`commandRead.ts`; it exposes the same
projection-graph nodes under command-local names because `commands.ts` cannot
import the domain namespace modules (they re-export command creators, which
would cycle). It reads the committed snapshot, so it shares the graph memo
rather than recomputing.

### Snapshot session

`createZerroSession` represents one immutable snapshot. Its internal reads are
lazy and each node is evaluated at most once for the session lifetime. No
cross-snapshot invalidation is needed. The session exposes only namespaced
reads grouped by domain with `get*` names (`session.envelopes.getAll()`,
`session.months.getTotals()`); new reads belong on the matching domain
namespace. Session context contains only nondeterministic dependencies such as
`now()` and `uuid()`. Root user and currency are derived from normalized data.

### Runtime engine

`internal/operations/replication/outbox.ts` is the engine: pure operations
defining append, undo/redo stack transitions, command rematerialization, and
primary-only transport. The only runtime-specific part is who owns the state —
in the React app that is Redux (`store/data/slice.ts`), and a future standalone
package wraps the same functions.

There is deliberately no second engine object. An in-memory `createZerroEngine`
reference implementation existed and was deleted: it had no production
consumer and was a standing invitation to grow a second implementation of
append, undo, redo, and replay rules. If a semantic engine facade is ever
needed, build it over these operations rather than beside them.

Issued commands append directly to the outbox. Redux performs authoritative
`current` rematerialization for append, undo, redo, and base changes. The sync
adapter asks the pure push-run module to derive bounded request transport from
the same durable outbox; Redux stores no parallel `data.diff` projection. Redux
may temporarily retain a prepared request for an explicit retry, but that is an
adapter concern rather than a second replica or product inbox.

## Read model and memoization

Pure projectors own calculations and declare which inputs are required. The
projection graph is defined once in `internal/projections/graph.ts`; both runtimes
instantiate it and own memoization at their own scope — a session binds the
graph to one frozen snapshot, the Redux adapter keeps one instance across
snapshots. Do not depend a node on the entire `current` store — it would
invalidate transaction-heavy calculations after unrelated writes; the graph
depends on individual entity maps and `projectionStability.test.ts` guards it.

Read `internal/projections/graph.ts` for the living dependency wiring rather than a
maintained diagram. Whether a node is memoized is a deliberate per-node call,
recorded in [design-ledger.md](./design-ledger.md#reads-and-redux-adapter).

Carry-forward projections such as `envMetrics` may need the full month range
up to the requested month; the optimization target is stable upstream caching,
not independent calculation of every month.

## Domain and presentation

Domain envelopes contain semantic state only: identity, normalized and source
titles, hierarchy, stable group id, configured tag color, visibility, currency,
and budgeting behavior. Presentation envelopes may add localized labels and
group names, emoji/SVG resolution, generated and display colors, and future
bank logos. Reusable appearance policy belongs in an optional presentation
package or subpath; domain Core must not import bundler-specific SVG URLs,
i18n, React, or Redux.

Write commands must resolve against domain envelopes, never localized or
presentation-decorated views. This boundary is implemented: the session builds
tag envelopes from Core tag structure, while the Redux adapter applies
`TPresentedEnvelope` fields and localized groups afterward. Before compiling an
app draft, the adapter maps known localized default-group labels back to stable
domain group ids.

## Internal responsibilities

- **ZenMoney Core** works only with normalized data and owns: normalized
  entities, ids, dates, and timestamps; root user and entity facts; patch
  application and replay; entity commands and factories; ZenMoney-derived
  debtors and balance history; materialized server-like rules when implemented.
  Raw HTTP/wire conversion belongs to a sync adapter.
- **Zerro Core** depends on ZenMoney Core and owns: hidden-data formats and
  future migrations; the `🤖 [Zerro Data]` service-account convention; user
  settings, envelope metadata, envelope ids, budgets, goals, and FX data;
  high-level Zerro command compilation.
- **Runtime adapters** own: Redux subscriptions and selector memoization;
  IndexedDB or other persistence; ZenMoney HTTP synchronization; React hooks
  and event tracking; localization and concrete assets.

## Replica model

The browser replica is one linear canonical journal plus a command outbox. In
memory Redux owns the reconstructed live state and session-only redo stack:

```ts
type ReplicaState = {
  base: TDataStore
  current: TDataStore // replayOutbox(base, outbox)
  outbox: Command[]
  redo: Command[] // session only
}
```

IndexedDB has one database version and two stores. A schema upgrade from the
legacy per-domain cache is destructive; there is no record-level compatibility
format:

```ts
type PersistedReplica = {
  rootUserId: number
  serverTimestamp: number
  headSequence: number
  latestCheckpointSequence: number
  oldestSequence: number
  oldestServerTimestamp: number
  retainedBytes: number
  outbox: Command[]
}

type JournalEntry =
  | { rootUserId; sequence; kind: 'checkpoint'; snapshot; reason; byteSize }
  | { rootUserId; sequence; kind: 'transition'; transition; pushed; byteSize }
```

`sequence` is monotonically increasing per root user and is the IndexedDB key
with `rootUserId`. Server timestamps remain metadata and the synchronization
cursor. A full sync appends another checkpoint to the same line; it does not
create a branch. Empty pulls update only `PersistedReplica.serverTimestamp`.

Only a full sync, recovery, and retention write checkpoints — there is no
periodic one, so the replayed suffix grows with ordinary syncing until the user
asks for a full reload. That is the deliberate manual lever, not an oversight;
see `private/open-decisions.md` § 7, what writes a checkpoint during ordinary
use.

Startup gets the latest checkpoint directly, scans only its suffix through
`headSequence`, validates the reconstructed base, and then replays the parsed
outbox. History pages contain metadata only in Redux. Opening a historical
sequence scans backward to its nearest checkpoint and keeps only that selected
snapshot in memory. Historical viewing remains read-only; restore emits an
ordinary live command.

Canonical entry, manifest, cursor, and outbox updates share one IndexedDB
transaction. Redux is updated first. Browser persistence uses one Promise queue
per tab; after its first primary write failure it is disabled until reload and
the UI warns without blocking continued work. Compaction failures only log and
are retried at the next canonical commit or startup. Multiple active tabs are
intentionally not coordinated.

Retention uses the stricter of a 90-day server-time window and 100 MiB of
logical UTF-8 JSON entry bytes. One bounded pass folds only the oldest prefix
into a `retention` checkpoint at the last consumed sequence; sequences are
never renumbered. A pass runs after a canonical commit and once after startup.
The minimal current checkpoint and outbox may exceed the budget.

If canonical replay is corrupt, a structurally valid outbox is preserved, a
full sync writes a `recovery` checkpoint, and the outbox is replayed over it.
Ordinary commands and non-recovery sync stay blocked until that checkpoint is
accepted.
A corrupt outbox is not guessed or partially repaired: its raw value stays in
IndexedDB, commands and sync are blocked, and the user must explicitly discard
it before recovery can continue. A different root user clears both stores
before starting sequence 1, so accounts never share a journal or outbox.

Any future replica implementation must reuse the pure outbox operations. Two
implementations of append, undo, redo, or replay rules are not acceptable.

## Sync and conflicts

Successful ZenMoney responses are canonical normalized diffs. They contain the
accepted local changes as well as remote changes and the new server timestamp:

```txt
capture outbox prefix -> squash to one run command
                      -> prepare bounded chunk + cursor -> ZenMoney
canonical diff        -> applyPatch(base, diff)
                      -> remove exactly the chunk receipt
                      -> persist base + remaining command
                      -> prepare the next chunk
```

Manual sync captures a stable Outbox prefix and clears `redo`. Transport replay
starts from `base`, applies only primary command patches to a working snapshot,
and records touched ids and deletions. The final full entities come from that
primary-only snapshot, never from UI `current` with predicted effects. Commands
created after capture remain a suffix for the next Push run.

Before preparing the request, Core removes canonical historical rows that the
write API cannot recreate: budgets whose ordinary tag is absent and reminder
markers whose reminder is absent. Transactions pointing to an omitted marker
are sent with a null marker reference; the special global-budget tag remains
valid. Transactions wholly contained in accounts deleted by the same run are
also omitted because that account purge is verified server behaviour. This
normalization applies to commands already persisted in the outbox. If it
removes the entire captured prefix, Core sends a cursor-only request and drops
that prefix only after the response is accepted.

Core uses one request unless its serialized normalized body exceeds 2 MiB or
Cleanup needs singleton-account or singleton-tag phases. In a multi-Chunk run,
upserts are ordered by dependency and tag upserts are parent-first. Cleanup
starts with one account per Chunk. After each accepted account response, Core
applies the canonical diff and rematerializes the remaining command against the
new base, so removals already performed by an account cascade disappear without
encoding an unverified client-side cascade rule. Retained rows remain pending.
Other surviving deletion kinds follow. Tag deletions run last, one per request,
in deepest-child-first order calculated from the current canonical tree. HTTP
413 halves the current byte target and repacks the same unconfirmed work; one
item that still receives 413 stops the run.

A successful ZenMoney response updates `base` and acknowledges exactly the
items named by that Chunk's receipt without comparing final field values. The
first acknowledgement replaces the captured command prefix with one command
containing the remainder; each later acknowledgement shrinks that command.
Every accepted Chunk is persisted as its own canonical transition before the
next request. If a response is not processed, its items remain pending and may
be sent again. Network, 429, and 5xx retries therefore reuse the exact request;
a deterministic 400 stops rather than skipping an item.

Periodic pull uses the same canonical response path but acknowledges no local
command. Whether a dirty session pushes automatically remains an adapter policy,
not a capability classification between persisted command kinds.

First-stage conflict resolution is field-level last write wins in command
order. Upsert intentionally recreates a missing entity. Revisit this only with
evidence that remote deletion or silent partial rejection needs a different
product policy or multi-device editing justifies a richer conflict model.

## Migrations and compatibility

Hidden-data migrations belong to Zerro Core because the hidden format is a
domain contract. Core should read old formats and compile a write-back patch
when an upgrade is needed.

Temporary app bridges and exit criteria are tracked in
[design-ledger.md](./design-ledger.md). Do not preserve a bridge merely because
it appears in legacy code; preserve it until its listed replacement is ready.

## Architectural invariants

1. Production Core imports no Redux, React, storage, i18n, ZenMoney HTTP, or
   runtime values from `6-shared`.
2. Root `zerro-core` stays facade-only; adapter subpaths are explicit.
3. Root user and user currency are derived from data.
4. Nondeterminism enters through explicit context.
5. Projectors expose explicit dependencies; expensive nodes do not depend on
   the whole store.
6. Session memoization is snapshot-local; Redux owns cross-snapshot
   memoization.
7. Commands use narrow semantic inputs and do not import Redux selectors.
8. Local intent passes through the materializer; canonical server diffs do not.
9. `applyPatch` remains dumb and deterministic.
10. Replay rematerializes issued patch commands in prefix order.
11. Redux remains the sole replica owner in the React app.
12. Presentation decoration is not domain state.
13. Real-account fixtures require a concrete regression case and must never
    print or commit private contents.
14. Every migration slice is small, independently testable, and documented
    when it changes a boundary or next step.
