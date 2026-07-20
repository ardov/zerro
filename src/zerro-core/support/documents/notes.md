# Zerro Core working notes

- Updated: 2026-07-20
- Purpose: current position, remaining work, and deferred local smells.
  Implementation history stays in Git; contracts stay in
  [architecture.md](./architecture.md); settled decisions and risks stay in
  [design-ledger.md](./design-ledger.md).

## Current position

The behavioral migration is complete: production reads and writes go through the
domain namespaces of `zerro-core/redux`; legacy model objects, generic patch
APIs, and duplicate derived projections are gone; Redux owns durable
`base + outbox` plus a session-only `redo` stack and persists only the applied
command outbox; sync uses primary-only transport with whole-prefix
acknowledgement. The persisted command shape is specified once in
[architecture.md](./architecture.md#commands).

Reliable automated verification, ready bridge removal, and read-graph
simplification are done (see Git for the phase history). The code and
documentation diet is complete through the entity-flattening wave. The active
work is now the alphabetical source-layout migration in
[structure-migration.md](./structure-migration.md). It changes ownership and
import paths without changing runtime behavior. After it lands, resume the
manual completion smoke and materializer rules below.

## Remaining work

### 0. Alphabetical source layout — active

Follow the independently verified waves in
[structure-migration.md](./structure-migration.md). W1 is complete: production
uses the explicit replica entrypoint and the external-import allowlist is
enforced. W2 is complete: `domain/foundation` is independent and FX amount
helpers belong to ZenMoney. W3 is complete: ZenMoney now distinguishes
entities, model, and read-models; Zerro owns its account conventions and UI
color generation. W4 is complete: materialization, replication, and the shared
projection graph now live under `internal`. W5 is complete: public/session and
runtime implementations are at their final ownership paths, and the Redux
debug capability is named `core.debug`. The support part of W6 is complete:
demo data, test builders, and Core documents live under `support`; public
demo is a thin file facade, while tests import `support/testing` explicitly.
The few broad internal ZenMoney-barrel imports have been replaced with direct
owners and are now rejected by the boundary test. The Core root contains only
files plus the four intended ownership levels: `internal`, `public`, `runtime`,
and `support`.

### 1. Manual completion smoke — next checkpoint

Verify in one session:

1. initial load;
2. budget or goal edit;
3. transaction edit;
4. reload with pending outbox state (the undo stack survives and redo resets);
5. undo/redo, logout history reset, repeated-field writes, and a command
   appended in flight;
6. explicit sync sends the final primary entities, clears only the captured
   prefix, and rebases pending commands on the canonical response;
7. no console errors or lost local commands.

Exit: the completion gate in [testing.md](./testing.md) is satisfied.

Compatibility boundary: persisted replica V3 stores only the applied outbox.
The V2 reader performs one explicit migration by retaining its applied prefix
and dropping its redo tail. Future persisted command changes require backward
compatibility or an explicit migration/product decision.

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
- Split work by contract: each materializer rule should remain a separate
  commit.
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
Knip's remaining core findings are exported types used only internally; treat
them as audit evidence, not a deletion queue.
