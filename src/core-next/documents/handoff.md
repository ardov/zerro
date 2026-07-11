# Core Next handoff

- Updated: 2026-07-11
- Branch: `core-next`
- Worktree at handoff: verify before editing

This is the current routing document. Implementation history belongs in Git.

## Next task: Track C materializer rules

The completion plan through documentation/test cleanup is done. Start Track C
in the order defined by [roadmap.md](./roadmap.md), beginning with deleted
transaction immutability. Keep each materializer rule as a separate verified
slice and increment `materializerVersion` when semantics change.

Do not widen the frozen session facade, publish engine APIs, or add more replica
machinery without a concrete consumer or product requirement.

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
- The session facade is frozen until a real headless consumer exists.

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
re-litigated during Track C unless new evidence changes the product requirement:

- account balances may remain stale until synchronization;
- dirty sessions pause remote pulls until explicit sync;
- undo/redo semantics exist without a production UI;
- replica metadata is disposable; migrations are not required without a
  concrete continuity need.

## Verification baseline

For every materializer rule, test both the materialized patch and resulting
state, including batches and already-deleted entities. Compare with a real
ZenMoney response when available without exposing private fixture contents.

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
