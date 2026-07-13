# Zerro Core handoff

- Updated: 2026-07-13
- Branch: `core-next`
- Module: `src/zerro-core`
- Worktree: verify before editing

This file routes the next task. Git contains implementation history.

## Current state

- Legacy model objects, generic local patch writes, and the duplicate derived
  read graph are removed from production paths.
- App consumers use domain namespaces from `zerro-core/redux`; the adapter is
  the supported application surface.
- Redux owns `base + outbox + outboxHead`. `current`, pending counts, and sync
  transport derive from the applied prefix.
- Local commands store `command`, `intentPatch`, `appliedPatch`,
  `materializerVersion`, and creation time. Replay uses stored applied patches.
- Persistence validates versioned replay inputs and does not store derived
  state.
- The snapshot session remains frozen. Its deprecated flat `read` surface has
  no production consumer and is ready for removal.
- Materialization is identity-only. The engine facade and package expansion
  remain deferred until a real consumer exists.

## Next checkpoint: health and closure

Land this as small independent commits where practical:

1. **Reliable verification**
   - make default parallel `pnpm exec vitest run` green;
   - keep package declaration checking as an explicit boundary gate;
   - make changed Core files pass ESLint and Prettier;
   - configure dead-code reporting before deleting from its output.
2. **Ready bridge removal**
   - remove deprecated `createZerroSession().read` and update parity tests;
   - move transaction filtering out of `5-entities` into a Core-owned boundary;
   - migrate the last legacy instrument selector consumers;
   - remove adapter members without real consumers.
3. **Remove false documentation**
   - delete the descriptive `readGraph` and its self-consistency tests unless
     it is changed to verify actual session/Redux wiring.
4. **Manual completion smoke**
   - edit a budget or goal;
   - edit a transaction and reload with a pending outbox;
   - perform explicit sync and verify canonical rebase.

## After closure: materializer checkpoint

Before transaction-balance effects or account-deletion cascades:

1. decide whether sync sends intent, applied effects, or a dedicated transport
   encoding;
2. capture representative ZenMoney responses for each rule;
3. define pending-outbox behavior across materializer versions;
4. implement one deterministic rule per verified commit.

Deleted-transaction immutability is the smallest first rule. Balance effects,
account deletion, and transfer conversion follow only after the transport
decision.

## Boundaries to preserve

- Root `zerro-core` stays facade-only; the app uses `zerro-core/redux`.
- Domain/application code must not import Redux, React, IndexedDB,
  localization, worker code, or app runtime modules.
- Commands express writable intent; avoid `Partial<TEntity>` APIs.
- `applyPatch` remains dumb; cross-entity behavior belongs in materialization.
- Canonical server diffs bypass local materialization.
- Redux remains the only reactive replica owner.
- Persist replay inputs, not `current`, sync transport, or response staging.

## Accepted product risks

- Account balances may be stale until explicit synchronization.
- Dirty sessions pause remote pulls until explicit sync.
- Undo/redo semantics exist without a production UI.
- Replica metadata is disposable until continuity requirements justify
  migrations.

## Completion gate

Do not call the refactor complete until:

1. focused tests, TypeScript, default parallel Vitest, package consumer,
   formatting, and dependency boundaries are green;
2. the manual budget/goal, transaction reload, and explicit-sync smoke passes;
3. production uses no legacy model API that the Redux adapter replaces;
4. remaining compatibility code has an owner and an exit condition.

See [testing.md](./testing.md) for the verification matrix and
[roadmap.md](./roadmap.md) for ordering.
