# Zerro Core design ledger

- Updated: 2026-07-16
- Purpose: settled decisions, accepted risks, active bridges, and unresolved
  architectural questions. History stays in Git.

## Settled decisions

### Module and package boundary

- Zerro Core is an internal app module until a real external/headless consumer
  exists.
- Root `zerro-core` exports only constants, shared root types, and the snapshot
  session.
- The React app uses the explicit namespace-first `zerro-core/redux` adapter.
- `domain`, `application`, `infrastructure`, and `presentation` are internal
  implementation paths, not supported app APIs.
- The reference engine and outbox primitives are internal. Redux remains the
  only reactive replica owner.
- Do not add package subpaths, an `exports` policy, or a semantic engine facade
  in advance of a consumer.

### Reads and Redux adapter

- Session reads are grouped by domain and use `get*` names.
- A session represents one immutable snapshot and memoizes each node once.
- Redux owns cross-snapshot memoization with granular entity-shaped selectors.
- The projection dependency map is maintained as Mermaid documentation in
  `architecture.md`, not as executable graph metadata.
- Selector, hook, command, and app-facing types live in their domain modules;
  `redux/state.ts` owns raw inputs and `commandRead.ts` owns command-time reads.
- Domain namespaces are the desired adapter shape. Add and retain members only
  for real consumers.
- Activity and budget projections retain aggregate amounts and transaction
  counts, never transaction arrays. Transaction lists filter the canonical
  history on demand.
- Transaction filters are typed query clauses. Intrinsic clauses compile from
  transaction fields; activity/envelope clauses use the same pure routing
  projector as activity calculation, with context prepared at the adapter
  boundary.
- Query clauses compose with AND; multiple values inside one clause compose
  with OR. Compile sets and envelope scope once, outside the transaction loop.
- Localization, generated colors, icons, and asset URLs remain outside domain
  Core.

### Commands and materialization

- Outbox entries are flat durable commands with only creation time added. They
  persist neither entry ids nor parallel intent/applied patches.
- `transactions.patch` stores one whitelist field set plus target
  ids. The whole entry is one undo/redo and acknowledgement unit.
- `created` is server-owned after transaction creation. A time edit stores
  `transaction.recreate` with durable source/replacement ids and
  materializes both hiding the original and creating the replacement.
- Commands set absolute values and remain idempotent. Relative operations such
  as toggle or increment require a distinct semantic command.
- Specialized adapter verbs such as `setViewed` may compile directly to the
  generic durable transaction patch without minting another persisted shape.
- Unmigrated command families use `patch`, a resolved full-patch command.
  It preserves behavior but does not promise field-level remote rebase.
- `applyPatch` applies only explicit changes and owns no cross-entity rules.
- Canonical server diffs bypass local materialization.
- Replay rematerializes the command prefix against `base` in order.
- Missing or deleted transaction targets are terminal no-ops for sparse field
  patches, matching observed server immutability.

### Replica and sync

- The durable logical replica is `base`, `outbox`, and `outboxHead`; `current`
  and request transport are derived.
- Undo/redo move `outboxHead`; append after undo drops the redo tail.
- The loaded app maps platform history shortcuts to undo/redo only outside
  text-editing controls and only when that history direction is available.
- Persistence stores versioned replay inputs plus the base server timestamp,
  not derived state.
- Periodic sync may run with a non-empty prefix only when every pending command
  is a rebase-safe transaction patch or recreate. Transitional commands still
  pause it.
- Manual sync drops the redo tail, captures the sent prefix length,
  rematerializes transport with fresh entity versions, applies the response as
  canonical, and removes narrow commands only when their requested fields are
  satisfied. Undo/redo remains disabled until the request finishes.
- Transitional `patch` retains whole-batch acknowledgement until its
  command family is migrated.
- First-stage conflict policy is entity-level last write wins.

### Testing

- Focused domain/contract tests protect behavior; Redux invalidation tests
  protect memoization edges.
- Deterministic demo data protects representative public graph behavior.
- Legacy parity tests are temporary bridges and leave with their implementation.
- Trivial map access and self-consistency tests are not valuable by default.
- Package declaration compilation is a separate boundary gate.
- The default parallel suite must pass; serial-only green is diagnostic, not a
  completion result.

## Accepted product risks

- Transaction edits may leave `account.balance` stale until synchronization;
  balance effects belong to materialization.
- Dirty sessions containing transitional commands do not sync automatically.
- Undo/redo is keyboard-accessible in the loaded application; visible controls
  remain deferred.
- Replica metadata is disposable until product continuity requirements justify
  migrations.

## Active compatibility bridges

### `6-shared/types`

This is the intentional compatibility facade for Core-owned normalized types.
Move consumers gradually; do not perform a big-bang type migration or widen the
Core root to expose implementation barrels.

### Demo and presentation wrappers

- `src/demoData` remains a thin wrapper over `zerro-core/demo`.
- App tag SVG/assets remain outside domain Core while package-safe emoji
  metadata lives in `presentation/tag-icons`.

Keep these bridges until a real consumer or package decision makes their exit
useful.

## Open questions

### Resolved command migration — blocks non-identity effects

Current sync transport rematerializes commands. Before adding balance or
cascade effects for a command family, replace its transitional `patch`
with a narrow durable command and define which primary entities its transport
encoder sends. Server-materialized balance and cascade effects must not be sent
back as client intent.

### Materializer evidence and versioning

- Which real ZenMoney responses become fixtures for transaction balance,
  account deletion, and transfer conversion?
- Pending replica metadata currently has no compatibility or migration
  requirement. Revisit versioning only when real persisted users exist.

### Product rules

- How should renaming a visible payee envelope affect several raw payee
  spellings?
- Which migrated command families are safe enough to opt into background sync?

### Future surfaces — not scheduled

- Which consumer would justify a semantic engine facade?
- Which presentation assets need a supported package boundary?
- Which package subpaths should exist if Core becomes publishable?

## Update rules

- Move an answer into settled decisions only when it is implemented or
  explicitly accepted.
- Remove a bridge with its last consumer.
- Put concrete local smells in [cleanup-notes.md](./cleanup-notes.md).
- Put implementation history in Git, not this ledger.
