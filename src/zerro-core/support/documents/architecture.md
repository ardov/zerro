# Zerro Core architecture

- Status: accepted target architecture for an incremental migration
- Updated: 2026-07-20

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
base + command prefix -> materialized patches -> current
base + command prefix -> fresh transport patch
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
  account?: AccountPatch[]
  merchant?: MerchantPatch[]
  tag?: TagPatch[]
  budget?: BudgetPatch[]
  reminder?: ReminderPatch[]
  transaction?: TransactionPatch[]
  deletion?: DeleteIntent[]
}
```

This list is closed. Reference and server-owned families such as instruments,
countries, companies, users, and reminder markers are not command intent. The
issue and persistence boundaries reject them instead of implicitly inheriting
every `TNormalizedPatch` member. There is no outbox-entry wrapper, entry id, durable
command union, or persisted materialized patch.

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

Future predicted server rules belong here rather than in command compilers:

- changing transaction amounts updates affected account balances;
- deleting an account permanently deletes its non-transfer transactions;
- transfers involving a deleted account become income or outcome on the
  surviving account;
- a transaction already marked `deleted` ignores subsequent patches.

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

`infrastructure/replica/outbox.ts` is the engine: pure operations defining head
clamping, command-prefix reads, redo-tail truncation on append, command
rematerialization, and primary-only transport. The only runtime-specific part
is who owns the state — in the React app that is Redux (`store/data/slice.ts`),
and a future standalone package wraps the same functions.

There is deliberately no second engine object. An in-memory `createZerroEngine`
reference implementation existed and was deleted: it had no production
consumer and was a standing invitation to grow a second implementation of
append, replay-prefix, clamp, and redo-tail rules. If a semantic engine facade
is ever needed, build it over these operations rather than beside them.

Issued commands append directly to the outbox. Redux performs authoritative
`current` rematerialization for append, undo, redo, and base changes. The sync
adapter derives request transport from the same command prefix; Redux stores no
parallel `data.diff` projection. Redux may temporarily stage a response between
reducer actions, but that is an implementation detail, not a product inbox.

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

The logical persisted replica consists of:

```ts
type ReplicaState = {
  base: TDataStore
  outbox: Command[] // the persisted command shape defined in Commands above
  outboxHead: number
}
```

`base.serverTimestamp` identifies the accepted server snapshot. Physical
storage may keep normalized base domains and outbox metadata in separate
records, but together they must describe one coherent logical replica.

`base` is the last accepted snapshot. `current` is derived by rematerializing
the command prefix:

```ts
current = materializeCommands(base, outbox.slice(0, outboxHead))
```

Replica persistence is a separate versioned IndexedDB record storing the
current command-only schema and nothing derived. There are no compatibility or
migration requirements for an older command format. Malformed replay metadata
is discarded rather than blocking canonical local data from loading. Reload
accepts a snapshot only when its base timestamp matches the loaded server
base, so legacy storage and stale metadata do not replay against the wrong
snapshot.

Undo and redo move only `outboxHead`. A new command after undo drops the redo
tail. Starting manual sync also drops the redo tail because synchronization
commits the currently applied history branch. No inverse patches are stored.

Only `base`, `outbox`, and `outboxHead` are durable inputs; sync progress and
errors are ephemeral. There is no durable inbox or incoming-change history.

Any future replica implementation must reuse the pure outbox operations. Two
implementations of append, replay-prefix, clamp, and redo-tail rules are not
acceptable.

## Sync and conflicts

Successful ZenMoney responses are canonical normalized diffs. They contain the
accepted local changes as well as remote changes and the new server timestamp:

```txt
fresh transport from command prefix + cursor -> ZenMoney
canonical diff                               -> applyPatch(base, diff)
                                             -> drop sent command count
                                             -> rematerialize pending commands
```

Manual sync is a commit boundary. It discards the redo tail, records the sent
prefix length, and rematerializes its transport against the current base with
fresh entity versions. Undo/redo is disabled while the request is active, so
new commands can only append after that stable prefix. Transport replay starts
from `base`, applies only primary command patches to a working snapshot, and
records touched ids and deletions. The final full entities come from that
primary-only snapshot, never from UI `current` with predicted effects.

A successful ZenMoney response updates `base` and acknowledges the whole sent
prefix. Core removes exactly the captured command count without comparing
final field values. This matters when several commands changed the same field:
the last value wins, while every sent command remains part of the accepted
batch. Commands created while the request was in flight are preserved and
replayed over the new base. If the request fails, neither base nor the command
outbox changes.

Periodic sync uses the same primary-only transport path, canonical response,
and whole-prefix acknowledgement boundary. Whether a dirty session syncs
automatically remains an adapter policy, not a capability classification
between persisted command kinds.

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
