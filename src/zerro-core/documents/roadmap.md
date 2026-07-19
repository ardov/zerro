# Zerro Core roadmap

- Updated: 2026-07-19
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
- Redux owns `base + outbox + outboxHead` and persists command-only replay
  inputs;
- every outbox value uses the same `TCommand` patch shape; sparse transaction
  edits rematerialize over the latest base while transitional compilers still
  emit complete entities inside that patch.

Reliable automated verification, ready bridge removal, and read-graph
documentation are complete. The final explicit-sync browser smoke remains.

## Phase 1: health and closure — current

### 1. Reliable verification — completed 2026-07-14

- Make default parallel `pnpm exec vitest run` stable. The same suite passing
  only with `--no-file-parallelism` is not sufficient.
- Avoid a blanket global timeout increase. Remove unnecessary dynamic imports,
  isolate expensive package compilation, or give only genuinely expensive
  boundary tests an explicit contract.
- Keep `pnpm zerro-core:package-check` as the declaration-consumer gate.
- Make Core formatting clean and adopt a useful ESLint warning budget.
- Configure Knip with real application entrypoints before treating its report
  as deletion authority.

The package declaration consumer is an explicit gate rather than a nested
Vitest test, the import-heavy session parity test loads its dependencies before
the test timeout starts, ESLint enforces a zero-warning budget, and Knip starts
from the app, worker, and package-consumer entrypoints.

Exit: the documented default commands are reproducibly green.

### 2. Ready bridge removal — completed 2026-07-14

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

The snapshot session is namespace-only, transaction filtering is owned and
tested by the Core transaction domain, legacy account/instrument selectors are
gone, and the adapter no longer exposes members without application consumers.

Exit: remaining legacy imports are presentation or explicit compatibility, not
domain/read/write ownership.

### 3. Session/read-graph simplification — completed 2026-07-14

`application/session/readGraph.ts` is descriptive and its tests only validate
the description against itself. Choose one:

- delete it and keep explicit session/Redux wiring plus focused tests; or
- make it validate real wiring without becoming a generic graph framework.

Default recommendation: delete it. The architecture document is the durable
human-readable dependency reference.

Decision: preserve the dependency map as a Mermaid diagram in
`architecture.md`. The executable description and its self-consistency tests
were removed because they did not validate real session or Redux wiring.

### 4. Manual completion smoke

Verify in one session:

1. initial load;
2. budget or goal edit;
3. transaction edit;
4. reload with pending outbox state;
5. explicit sync and canonical rebase;
6. no console errors or lost local commands.

Exit: the completion gate in `testing.md` is satisfied.

## Phase 2: one sparse patch command — current

Replace the transitional command split with one persisted command shape. Land
the work as bounded verified slices:

1. **Done:** writable entity patch types live beside entity types and use
   `EntityPatch<TEntity, TWritableFields>` to list their writable surface;
2. **Done:** direct `TCommand[]` storage replaced `TOutboxEntry` and the durable
   command union; every command stores `type: 'patch'`, `issuedAt`, and
   `TIntentPatch`;
3. **Done:** issue captures time, generated ids, absolute values, and
   caller-only receipts before append;
4. **In progress:** existing account/reminder results compile to changed
   writable fields and deletions persist only identity; convert the remaining
   transitional entity families;
5. implement deterministic upsert materialization: patch an existing id, create
   a missing id, and reject incomplete creation intent before persistence;
6. replay the applied prefix into `current`, keeping `applyPatch` dumb.

Exit: all production writes persist the same command type; reload and undo/redo
reproduce the same `current` without ambient ids or time.

## Phase 3: primary-only sync and batch acknowledgement

1. freeze the applied prefix as `sentOutboxCount` and disable undo/redo while
   the request is active;
2. replay the sent prefix from `base` into a primary-only working snapshot with
   fresh `sentAt` versions;
3. collect touched ids/deletions and build transport from that working snapshot,
   never from UI `current`;
4. **Done:** on success apply the canonical response to `base` and remove
   exactly the sent command count without per-command satisfaction checks;
5. preserve commands appended during the request and replay them over the new
   base; on failure leave base and outbox unchanged;
6. update persistence validation/versioning and discard incompatible local
   metadata rather than adding a migration framework.

Compatibility boundary: until the first rollout of this command schema, local
outbox metadata is disposable. After rollout, persisted commands require
backward compatibility or an explicit migration/product decision.

Exit: two sent commands may touch the same field, the last value wins, and the
whole successful prefix is acknowledged without losing commands appended in
flight.

## Phase 4: materializer rules

Implement one rule per checkpoint:

1. deleted transactions ignore subsequent patches;
2. transaction amount/account changes update affected account balances;
3. deleting an account permanently deletes its non-transfer transactions;
4. transfers involving a deleted account become income/outcome on the survivor.

For each rule:

- test the materialized patch and resulting state;
- cover batches, upsert creation, deletion, and repeated field writes;
- compare with a real ZenMoney response when possible;
- add command versioning only when real persisted compatibility exists;
- keep canonical server diffs and dumb `applyPatch` unchanged;
- keep predicted effects out of primary-only transport.

## Deferred until evidence exists

- semantic Redux-backed engine facade;
- published package exports and supported implementation subpaths;
- presentation package split and asset-resolver API;
- visible undo/redo controls beyond the existing keyboard shortcuts;
- replica migration framework or atomic multi-store persistence;
- generic graph/configuration framework;
- richer demo runtimes and speculative bulk APIs.

## Choosing work

- Follow the current phase in order; a verified independent smoke may land
  between command slices.
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
