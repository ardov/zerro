# Zerro Core documentation

`src/zerro-core` extracts Zerro domain behavior behind explicit, testable
boundaries. These documents describe current contracts and next decisions;
implementation history belongs in Git.

## Module layout

```txt
domain/          normalized ZenMoney and Zerro domain behavior
application/     snapshot session and materialization use cases
infrastructure/  replica, outbox, replay, and persistence
redux/           React app selectors, hooks, and semantic commands
presentation/    package-safe appearance data
demo/            deterministic public demo data
testing/         test-only builders and comparison helpers
```

Dependencies point inward. Domain and application code do not import Redux,
React, storage, localization, or app-layer runtime modules.

## Current position

- The app reads and writes Core through domain namespaces from
  `zerro-core/redux`.
- Production writes use semantic commands; generic patch APIs and legacy model
  objects are retired.
- Redux is the sole reactive owner of `base + command outbox + outboxHead`;
  `current` and sync transport are rematerialized from commands.
- The root entrypoint remains a small internal facade: constants, shared root
  types, and the snapshot session. Replica primitives stay internal.
- The outbox persists direct `TCommand[]` values with `type: 'patch'`,
  `issuedAt`, and `TIntentPatch`. Sparse transaction edits rebase over current
  entities; transitional compilers may still put complete entities into the
  same patch shape.
- Materialization now owns command replay and deleted-transaction no-ops.
  Balance and cascade rules remain the next architectural phase.

## Next slice: sparse compilers and upsert

Convert transitional full-entity compilers to sparse intent and deletion refs,
then add deterministic factory-backed upsert replay and primary-only transport.
Successful sync already acknowledges the captured sent prefix as a batch. The
ordered implementation slices are in [roadmap.md](./roadmap.md).

## Start here

1. Inspect `git status --short` and recent commits.
2. Read [handoff.md](./handoff.md) for the next bounded checkpoint.
3. Read [architecture.md](./architecture.md) before changing a boundary.
4. Use [roadmap.md](./roadmap.md) for ordering.
5. Check [design-ledger.md](./design-ledger.md) before changing a settled
   decision.
6. Use [cleanup-notes.md](./cleanup-notes.md) for deferred local smells.

The handoff is routing, not proof. Git and current verification outrank stale
prose.

## Document map

| Document                                            | Purpose                                      |
| --------------------------------------------------- | -------------------------------------------- |
| [handoff.md](./handoff.md)                          | Current state and next checkpoint            |
| [architecture.md](./architecture.md)                | Durable boundaries and runtime contracts     |
| [roadmap.md](./roadmap.md)                          | Ordered completion plan                      |
| [design-ledger.md](./design-ledger.md)              | Settled decisions, risks, and open questions |
| [testing.md](./testing.md)                          | Verification policy and completion gate      |
| [cleanup-notes.md](./cleanup-notes.md)              | Deferred concrete cleanup                    |
| [ZenMoney sync API](../domain/zenmoney/sync-api.md) | Observed server behavior and wire shape      |

Entity-specific ZenMoney behavior belongs beside its implementation under
`domain/zenmoney/*/README.md`.

## Working rules

- Prefer one bounded, verified slice over a broad rewrite.
- Keep commands intent-shaped and entity-local patch compilers internal.
- Keep presentation, localization, assets, Redux, and persistence outside the
  domain layer.
- Compare resulting state for command changes, not only patch shape.
- Add public exports only for real consumers.
- Update the relevant decision or handoff in the same commit as a boundary
  change.

## Verification defaults

```bash
pnpm exec vitest run <focused tests>
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm zerro-core:package-check
git diff --check
```

Changed files must also pass Prettier. The default parallel test run must be
green; a serial-only pass is diagnostic evidence, not the completion gate.
