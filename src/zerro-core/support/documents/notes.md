# Zerro Core working notes

- Updated: 2026-07-29
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
documentation diet and alphabetical source-layout migration are complete. The
remaining Core completion smoke and materializer rules stay below. A local
agent-facing CLI is now an accepted independent MVP track; its executable plan
is [local-tooling.md](./local-tooling.md).

The local-tooling W-1 Core preparation is complete: canonical acceptance,
cursor overlap, empty-store creation, semantic transaction creation, session
transaction queries, and the explicit `zerro-core/headless` boundary are in
place and reused by Redux where applicable. W0 and W1 are complete: the CLI can
refresh a private local replica and expose bounded account, tag, merchant,
transaction, month, envelope, goal, and debtor reads. W2 envelope-budget
preview/stage plus outbox inspection and undo is the next incomplete slice.

## Remaining work

### 0. Manual completion smoke — next Core checkpoint

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

### 1. Materializer rules

The rule set, its evidence, and the per-rule verification requirements live in
[materialization.md](./materialization.md). Implement one rule per checkpoint.
Rules 1 (deleted transactions ignore patches) and 2 (the verified same-account
permanent-delete write purges the row) are done; balances are the next valuable
one because they are the remaining rule with a visible wrong number today.
Account, tag, and merchant cascades become reachable when the matching deletion
commands ship.

### 2. Local agent tooling — accepted independent track

Follow [local-tooling.md](./local-tooling.md) from its first incomplete status
row. The accepted MVP is an agent-first repository-local CLI with
machine-readable help, bounded JSON, one private JSON replica file,
`ZM_TOKEN`, separate preview/stage/sync operations, and retry-safe outbox
request ids. It includes bounded account/tag/merchant/envelope discovery,
envelope hierarchy and monthly metrics, atomic envelope-budget preview/stage,
transaction creation, outbox undo, and explicit sync. MCP is optional and starts
only after the CLI is complete.

This track does not require publishing or physically moving Core. It may
proceed before balance prediction lands, provided transaction previews state
that canonical account balances may change after sync.

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
- When working on local tooling, follow its own wave order and status table
  rather than interleaving several waves.
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
