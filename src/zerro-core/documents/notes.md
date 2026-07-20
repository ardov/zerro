# Zerro Core working notes

- Updated: 2026-07-20
- Purpose: current position, remaining work, and deferred local smells.
  Implementation history stays in Git; contracts stay in
  [architecture.md](./architecture.md); settled decisions and risks stay in
  [design-ledger.md](./design-ledger.md).

## Current position

The main migration is complete: production reads and writes go through the
domain namespaces of `zerro-core/redux`; legacy model objects, generic patch
APIs, and duplicate derived projections are gone; Redux owns
`base + outbox + outboxHead` and persists command-only replay inputs; sync uses
primary-only transport with whole-prefix acknowledgement. The persisted command
shape is specified once in
[architecture.md](./architecture.md#commands).

Reliable automated verification, ready bridge removal, and read-graph
simplification are done (see Git for the phase history). Remaining work: the
manual completion smoke, then materializer rules, then the simplification plan.

## Remaining work

### 1. Manual completion smoke — next checkpoint

Verify in one session:

1. initial load;
2. budget or goal edit;
3. transaction edit;
4. reload with pending outbox state (pending command outbox survives reload);
5. undo/redo, repeated-field writes, and a command appended in flight;
6. explicit sync sends the final primary entities, clears only the captured
   prefix, and rebases pending commands on the canonical response;
7. no console errors or lost local commands.

Exit: the completion gate in [testing.md](./testing.md) is satisfied.

Compatibility boundary: until the first rollout of this command schema, local
outbox metadata is disposable and incompatible local metadata may be discarded.
After rollout, persisted commands require backward compatibility or an explicit
migration/product decision.

### 2. Materializer rules

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

### 3. Simplification plan

Code and documentation diet workstreams live in
[simplification-plan.md](./simplification-plan.md).

## Deferred until evidence exists

- semantic Redux-backed engine facade;
- published package exports and supported implementation subpaths;
- presentation package split and asset-resolver API;
- visible undo/redo controls beyond the existing keyboard shortcuts;
- replica migration framework or atomic multi-store persistence;
- generic graph/configuration framework;
- richer demo runtimes and speculative bulk APIs.

## Choosing work

- Follow the order above; a verified independent smoke may land between slices.
- Split work by contract: each materializer rule and each simplification
  workstream should remain separate commits.
- A concrete product regression may override this order; document the evidence
  when it does.

## Deferred local smells

Concrete local smells that do not yet justify architectural work. Remove a note
when it is fixed or promoted into a decision.

### Dynamic normalized-patch plumbing

`domain/zenmoney/applyPatch.ts` and
`domain/zerro/hidden-data/write.ts#mergeNormalizedPatches` use dynamic entity
keys and still need `@ts-expect-error` or `as never`. The behavior is
centralized and tested. If these files change for domain reasons, prefer one
small explicit entity-map helper over a mapped-type framework.

### Reminder command atomicity

Reminder `set` accepts create drafts, update patches, arrays, and mixed arrays.
Split create/update/bulk commands only when a new use case defines receipts,
partial failure, and atomicity.

### Date guards validate shape only

`isISODate` and `isISOMonth` accept correctly shaped invalid calendar values.
Add calendar validation only at a boundary with a demonstrated bad-data case.

### Payee envelope rename

One visible payee may represent several raw transaction spellings. Renaming
needs a product rule; keep the explicit unsupported case instead of a type or
patch workaround.

### Knip findings

Knip is configured from the real app, worker, and package-consumer entrypoints
(audit 2026-07-14: no unused files). Remaining findings are unused exports and
types; Knip output is evidence for an audit, not automatic deletion authority.
Dead-export deletion is tracked as workstream W1 of the simplification plan.
