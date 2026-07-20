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

## Start here

1. Inspect `git status --short` and recent commits.
2. Read [notes.md](./notes.md) for the current position and next checkpoint.
3. Read [architecture.md](./architecture.md) before changing a boundary; its
   Commands section is the single canonical persisted command shape.
4. Check [design-ledger.md](./design-ledger.md) before changing a settled
   decision.
5. Use [simplification-plan.md](./simplification-plan.md) for the active
   code/documentation diet workstreams.

The notes are routing, not proof. Git and current verification outrank stale
prose.

## Document map

| Document                                            | Purpose                                           |
| --------------------------------------------------- | ------------------------------------------------- |
| [architecture.md](./architecture.md)                | Durable boundaries and runtime contracts          |
| [design-ledger.md](./design-ledger.md)              | Settled decisions, risks, and open questions      |
| [notes.md](./notes.md)                              | Current position, remaining work, deferred smells |
| [simplification-plan.md](./simplification-plan.md)  | Active simplification workstreams                 |
| [testing.md](./testing.md)                          | Verification policy and completion gate           |
| [ZenMoney sync API](../domain/zenmoney/sync-api.md) | Observed server behavior and wire shape           |

Entity-specific ZenMoney behavior belongs beside its implementation under
`domain/zenmoney/*/README.md`.

## Working rules

- Prefer one bounded, verified slice over a broad rewrite.
- Keep commands intent-shaped and entity-local patch compilers internal.
- Keep presentation, localization, assets, Redux, and persistence outside the
  domain layer.
- Compare resulting state for command changes, not only patch shape.
- Add public exports only for real consumers.
- Update the relevant decision or note in the same commit as a boundary
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
