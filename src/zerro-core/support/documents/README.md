# Zerro Core documentation

`src/zerro-core` extracts Zerro domain behavior behind explicit, testable
boundaries. These documents describe current contracts and next decisions;
implementation history belongs in Git.

## Module layout

```txt
internal/  domain behavior, operations, and shared projections
public/    package-safe snapshot session
runtime/   persistence, presentation policy, and Redux adapter
support/   demo data, documentation, and test builders
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
5. For local CLI work, read [local-tooling.md](./local-tooling.md) for the
   contract and [tools/zerro/README.md](../../../../tools/zerro/README.md) for
   usage.

The notes are routing, not proof. Git and current verification outrank stale
prose.

## Document map

| Document                                                        | Purpose                                               |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| [architecture.md](./architecture.md)                            | Durable boundaries and runtime contracts              |
| [materialization.md](./materialization.md)                      | Predicted local effects and server cascades           |
| [local-tooling.md](./local-tooling.md)                          | Agent CLI contract and the constraints it works under |
| [design-ledger.md](./design-ledger.md)                          | Settled decisions, risks, and open questions          |
| [notes.md](./notes.md)                                          | Current position, remaining work, deferred smells     |
| [testing.md](./testing.md)                                      | Verification policy and completion gate               |
| [ZenMoney sync API](../../internal/domain/zenmoney/sync-api.md) | Observed server behavior and wire shape               |
| [tools/zerro/README.md](../../../../tools/zerro/README.md)      | How to use the shipped CLI                            |
| `private/open-decisions.md` (not in this repository)            | Questions waiting on the maintainer                   |

Entity-specific ZenMoney behavior belongs beside its implementation under
`internal/domain/zenmoney/*/README.md`.

## Working rules

- Prefer one bounded, verified slice over a broad rewrite.
- Keep commands intent-shaped and entity-local patch compilers internal.
- Keep presentation, localization, assets, Redux, and persistence outside the
  domain layer.
- Compare resulting state for command changes, not only patch shape.
- Add public exports only for real consumers.
- Update the relevant decision or note in the same commit as a boundary
  change.

## Verification

[testing.md](./testing.md) owns the commands, the per-change matrix, and the
rule that only a green default parallel run counts as a result.
