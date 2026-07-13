# Zerro Core roadmap

- Updated: 2026-07-13
- Purpose: order remaining work; history stays in Git.

## Goal

Finish the extraction as a stable internal module with:

- semantic reads and writes through `zerro-core/redux`;
- one Redux-owned replica and deterministic replay;
- explicit domain/application/infrastructure/presentation boundaries;
- verification that is reliable enough to block regressions;
- no speculative package or engine surface.

## Current position

The main migration is complete:

- normalized domain entities and projection chains live in Core;
- production writes use semantic commands;
- production app reads use domain-grouped Redux namespaces;
- legacy model-object calls and duplicate derived projections are removed;
- Redux owns `base + outbox + outboxHead` and persists minimal replay inputs;
- materialization is wired into every local command but remains identity-only.

The refactor is not complete because the default test gate is load-sensitive,
some compatibility bridges are now ready to remove, and the final explicit-sync
browser smoke has not been completed.

## Phase 1: health and closure — current

### 1. Reliable verification

- Make default parallel `pnpm exec vitest run` stable. The same suite passing
  only with `--no-file-parallelism` is not sufficient.
- Avoid a blanket global timeout increase. Remove unnecessary dynamic imports,
  isolate expensive package compilation, or give only genuinely expensive
  boundary tests an explicit contract.
- Keep `pnpm zerro-core:package-check` as the declaration-consumer gate.
- Make Core formatting clean and adopt a useful ESLint warning budget.
- Configure Knip with real application entrypoints before treating its report
  as deletion authority.

Exit: the documented default commands are reproducibly green.

### 2. Ready bridge removal

- Remove deprecated flat `session.read` and rewrite the two remaining parity
  assertions through namespaced reads.
- Move transaction filtering and its basic condition types from `5-entities`
  into a Core-owned transaction boundary.
- Move the last consumers of the legacy instrument code-map selector to the
  Core Redux namespace, then delete the legacy selector.
- Audit namespace members against real consumers; remove dead exports such as
  unused commands instead of preserving them as hypothetical API.
- Keep the namespace-first adapter shape. The cleanup target is unused members,
  not a return to a flat barrel.

Exit: remaining legacy imports are presentation or explicit compatibility, not
domain/read/write ownership.

### 3. Session/read-graph simplification

`application/session/readGraph.ts` is descriptive and its tests only validate
the description against itself. Choose one:

- delete it and keep explicit session/Redux wiring plus focused tests; or
- make it validate real wiring without becoming a generic graph framework.

Default recommendation: delete it. The architecture document is the durable
human-readable dependency reference.

### 4. Manual completion smoke

Verify in one session:

1. initial load;
2. budget or goal edit;
3. transaction edit;
4. reload with pending outbox state;
5. explicit sync and canonical rebase;
6. no console errors or lost local commands.

Exit: the completion gate in `testing.md` is satisfied.

## Phase 2: materializer contract

Do not add balance or cascade effects until these decisions are explicit:

1. **Transport:** send `intentPatch`, `appliedPatch`, or a dedicated
   per-command transport encoding.
2. **Evidence:** record representative ZenMoney responses for account deletion,
   transfer conversion, and transaction balance changes.
3. **Versioning:** decide how pending entries created under an older
   `materializerVersion` behave after an upgrade.
4. **Atomicity:** define behavior for batches and already-deleted entities.

Keep replay on stored `appliedPatch`; do not reinterpret historical commands.

## Phase 3: materializer rules

Implement one rule per checkpoint:

1. deleted transactions ignore subsequent patches;
2. transaction amount/account changes update affected account balances;
3. deleting an account permanently deletes its non-transfer transactions;
4. transfers involving a deleted account become income/outcome on the survivor.

For each rule:

- test the materialized patch and resulting state;
- cover batches, missing entities, and already-deleted entities;
- compare with a real ZenMoney response when possible;
- increment `materializerVersion` when semantics change;
- keep canonical server diffs and dumb `applyPatch` unchanged.

## Deferred until evidence exists

- semantic Redux-backed engine facade;
- published package exports and supported implementation subpaths;
- presentation package split and asset-resolver API;
- product undo/redo controls;
- replica migration framework or atomic multi-store persistence;
- generic graph/configuration framework;
- richer demo runtimes and speculative bulk APIs.

## Choosing work

- Finish Phase 1 before Phase 2.
- Split work by contract: verification, bridge removal, transport decision, and
  each materializer rule should remain separate commits.
- A concrete product regression may override this order; document the evidence
  when it does.

## Verification

Use [testing.md](./testing.md). At minimum:

```bash
pnpm exec vitest run <focused tests>
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm zerro-core:package-check
git diff --check
```
