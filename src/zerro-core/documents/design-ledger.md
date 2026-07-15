# Zerro Core design ledger

- Updated: 2026-07-13
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

- Commands use narrow semantic inputs, not `Partial<TEntity>` projections.
- Internal entity patch compilers whitelist writable fields; outbox commands
  retain original domain intent.
- Singular commands are the default. Bulk APIs require explicit atomicity and
  error semantics.
- Command compilers produce intent patches. Local execution materializes them
  into complete applied patches.
- `applyPatch` applies only explicit changes and owns no cross-entity rules.
- Canonical server diffs bypass local materialization.
- Replay uses stored `appliedPatch`; it never recompiles commands or
  rematerializes history.
- Materialization remains identity-only until the transport checkpoint below.

### Replica and sync

- The durable logical replica is `base`, `outbox`, and `outboxHead`; `current`
  and request transport are derived.
- Undo/redo move `outboxHead`; append after undo drops the redo tail.
- Persistence stores versioned replay inputs plus the base server timestamp,
  not derived state.
- Periodic sync runs only while the applied prefix is empty.
- Manual sync is a commit boundary: drop the redo tail, capture sent entry ids,
  accept a successful response as canonical, remove exactly the sent entries,
  and replay commands created during the request.
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
- Dirty sessions do not pull remote changes until explicit sync.
- Undo/redo semantics exist without production controls.
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

### Materializer transport — blocks non-identity effects

Current sync transport merges stored `appliedPatch` values. Before balance or
cascade rules, decide whether the server should receive:

1. the original `intentPatch`;
2. the complete local `appliedPatch`; or
3. a dedicated per-command transport encoding.

The decision must prevent double application of server-like effects while
keeping local replay deterministic.

### Materializer evidence and versioning

- Which real ZenMoney responses become fixtures for transaction balance,
  account deletion, and transfer conversion?
- Do pending entries retain old applied effects indefinitely, or does a rule
  upgrade ever require an explicit outbox migration?

### Product rules

- How should renaming a visible payee envelope affect several raw payee
  spellings?
- When, if ever, should dirty sessions accept background remote changes?

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
