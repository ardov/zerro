# Core Next roadmap

- Updated: 2026-07-10
- Purpose: choose the next bounded slice; implementation history stays in Git.

## Current position

The normalized entity layer and read projection chain are broadly established.
The session now exposes namespaced `get*` reads over the same memoized nodes,
and `facade/readGraph.ts` records the important dependency edges. Flat
`session.read.*` remains deprecated compatibility.

Envelope reads are now split: session/Core projectors return domain envelopes,
and the Redux adapter adds symbols, generated/display colors, localized null
text, and localized groups. The old `populatedTags` session dependency is gone,
and envelope commands resolve against domain envelopes.

The first narrow write command is also landed: `renameEnvelope(id, name)`
routes tag, account, and merchant renames without accepting a partial envelope.
`setEnvelopeColor(id, colorHex)` adds validated tag color set/clear semantics
and is adopted by the existing color picker.

The old transaction `effects.ts` expansion has been removed. Transaction
commands now produce intent-only transaction patches; account-balance effects
remain documented for the final materializer phase.

`setEnvelopeComment(id, comment)` is also adopted by CommentWidget and removes
its unused month dependency.

`updateEnvelopeSettings(input)` now owns the edit dialog as one explicit atomic
command. The dialog is edit-only and sends only its five visible fields.

`createEnvelope(input)` now creates the tag and optional metadata atomically,
returns the new envelope id as a receipt, and normalizes default group labels at
the Redux boundary.

Envelope hierarchy is now one semantic command: `applyEnvelopeStructure`
accepts the full ordered structure (groups, nesting, order) and compiles
ordering, group, and parent changes into one atomic patch. The four hierarchy
consumers — envelope drag-and-drop, group move, group assignment, and group
rename — send only structure input; the legacy `applyStructure` thunk is
removed.

The compatibility envelope patch path is retired: `envelopeModel.patchEnvelope`,
the `zerro.envelope.patch` command, and app-layer `TEnvelopeDraft` exports are
gone. The envelope write family is fully semantic; envelope drafts stay
internal to Core compile functions.

The transaction thunk family now flows through the funnel: delete, permanent
delete, restore, mark viewed, update, recreate (with an id receipt), and bulk
edit all reuse the existing Core compilers. Broken `splitTransfer` is removed
with its commented-out consumer. `5-entities/transaction/thunks.ts` no longer
imports `applyLegacyPatch`; the remaining transaction-shaped legacy write is
`combineToOutcome` inside the transaction list bulk actions widget.

Replica ownership, server-like materialization rules, and package hardening
remain incomplete.

## Default next slice: semantic account, tag, and merchant writes

Goal: move the small entity write thunks off `applyLegacyPatch` using the
compilers Core already has.

Scope:

1. Route `patchAccount` and `setInBudget` through the funnel via
   `compilePatchAccount`.
2. Route `patchTag` and `createTag` via `compilePatchTag` and
   `compileCreateTag` (create returns an id receipt).
3. Route `patchMerchant` via `compilePatchMerchant`.
4. Keep `setTagBudget`, `combineToOutcome`, and `mergeAccounts` for later
   slices; merge needs explicit transfer/cascade semantics first.

Done when:

- the listed thunks dispatch semantic commands instead of `applyLegacyPatch`;
- resulting-state tests pass through the Redux command funnel;
- consumer signatures stay unchanged.

Do not start materializer rules, and do not attempt `mergeAccounts` in this
slice.

## Active tracks

| Track                           | State                    | Next useful outcome                                                       |
| ------------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| A. Public facade and read graph | Envelope writes semantic | Decide which adapter-level projectors deserve a supported subpath         |
| B. Domain/presentation boundary | Boundary landed          | Extract an optional appearance package only when a real consumer needs it |
| C. ZenMoney materializer rules  | Deferred until final     | Start only after the other architecture and migration tracks are complete |
| D. Replica and sync             | Designed, not integrated | Share pure outbox operations and make Redux the replica owner             |
| E. Legacy cutover               | Transaction thunks done  | Migrate account, tag, and merchant writes off the legacy bridge           |
| F. Package and test hardening   | Ongoing                  | Consumer-level export/type test and targeted parity coverage              |

## Track A: public facade and read graph

Goal: expose domain use cases without leaking projector assembly.

Current:

- namespaced `get*` methods directly reuse existing memoized functions;
- `session.read.*` remains deprecated compatibility;
- `facade/readGraph.ts` records important graph edges without driving runtime;
- Redux independently wires the same calculations with cross-snapshot caches.
- `renameEnvelope(id, name)` is the first adopted narrow write command.
- `setEnvelopeColor(id, colorHex)` is the second adopted narrow write command.
- `setEnvelopeComment(id, comment)` is the third adopted narrow write command.
- `updateEnvelopeSettings(input)` atomically owns the edit-dialog use case.
- `createEnvelope(input)` atomically creates tag+metadata and returns its id.
- `applyEnvelopeStructure(structure)` owns hierarchy: ordering, groups, and
  parents compile from full structure input in one atomic patch.

Next:

1. Add domain write methods that compile narrow semantic command inputs
   (transaction, account, and reminder families remain).
2. Decide which adapter-level projectors deserve a supported subpath.
3. Add explicit singular bulk APIs only when real use cases define atomicity.

Avoid a generic graph framework until simple wiring causes repeated defects.

## Track B: domain and presentation

Goal: keep Core envelope reads headless and move reusable appearance behavior
into an optional presentation boundary.

Current:

- `TEnvelope` contains domain fields only;
- `TPresentedEnvelope` adds symbol and generated/display colors in the adapter;
- stable group ids are localized only after domain projection;
- session reads require no adapter-prepared tag input;
- decorated Redux selectors retain legacy parity;
- envelope commands resolve against stable domain envelopes.

Later:

1. Decide whether presentation is a supported package subpath or a separate
   package.
2. Replace adapter imports with explicit label/icon/asset resolvers.
3. Add bank-logo catalogs keyed by stable company/account metadata.

Keep localization and bundler-resolved assets outside domain Core. Compare both
stable domain envelopes and final decorated Redux views during migration.

## Track C: materializer rules

Goal: reproduce known ZenMoney cross-entity behavior in one deterministic
layer instead of every command.

This track is intentionally last. Keep materialization identity-only until the
public API, presentation/package boundary, replica groundwork, legacy cutover,
and package hardening are complete enough that rule work will not churn their
contracts.

Current:

- every Redux local patch passes through `materializePatch`;
- `createZerroEngine` stores intent and applied patches with a rule version;
- materialization is identity-only;
- canonical server diffs bypass it.

Recommended rule order:

1. Deleted transaction immutability: later transaction patches do nothing.
2. Transaction amount effects: update affected account balances.
3. Account deletion cascade for non-transfer transactions.
4. Transfer conversion to income/outcome on the surviving account.

For each rule:

- test the materialized patch and resulting state;
- cover batches and already-deleted entities;
- compare with a real ZenMoney response when possible;
- increment `materializerVersion` when semantics change;
- keep dumb `applyPatch` unchanged.

Before step 2 or later, settle the sync transport question in the design ledger.

## Track D: replica and sync

Goal: replace legacy `data.diff` with explicit replica state without creating a
second app store.

Suggested order:

1. Extract pure outbox operations: append, drop redo tail, clamp head, replay
   applied prefix, and list pending entries.
2. Reuse them in `createZerroEngine` and Redux reducers.
3. Move Redux state toward `base`, `outbox`, `outboxHead`, `inbox`, `current`.
4. Rebase `applyServerPatch` and expose the pending sync payload.
5. Add reload plus undo/redo tests before switching more writes.

The in-memory engine remains a reference/headless implementation. Do not run it
beside Redux in the app.

## Track E: legacy cutover

Goal: remove compatibility paths only when a real consumer can switch safely.

High-value remaining work:

- transaction/account/reminder writes still using `applyLegacyPatch` or direct
  `applyClientPatch` (envelope writes are fully semantic now);
- `mergeAccounts`, which needs explicit transfer/cascade semantics;
- deep app imports from `core-next/zenmoney`, `core-next/zerro`, and tag
  presentation shims;
- compatibility re-exports under `6-shared/types`, demo data, and icon assets.

Switch one path at a time. Add parity or invalidation coverage appropriate to
that path, then update its bridge entry in the design ledger.

## Track F: package and tests

Goal: keep the package boundary trustworthy while migration continues.

Useful slices:

1. Generate declarations and compile a tiny external consumer using only
   supported entrypoints.
2. Enforce allowed subpaths once their list is settled.
3. Add demo scenarios only for genuinely distinct domain shapes.
4. Keep private fixture runs opt-in and privacy-safe.
5. Add dependency-direction checks for foundational type modules if barrel
   cycles continue to obscure the graph.

Do not add tests for trivial map lookups or speculative APIs.

## Choosing work

- Choose Track A by default.
- Choose Track B when working on tags, envelopes, icons, localization, or bank
  appearance.
- Do not choose Track C until the other tracks are complete; materializer rules
  are the final phase.
- Choose Track D when changing sync, undo/redo, persistence, or Redux data state.
- Choose Track E for a single concrete app consumer.
- Choose Track F when a boundary or fixture problem blocks another track.

If a task touches more than one track, split it unless the contract cannot be
verified independently.

## Verification defaults

Focused tests first, then:

```bash
pnpm exec tsc --noEmit
pnpm exec vitest run
```

Use private fixture commands only when the ignored local fixture exists. See
[private-fixtures.md](./private-fixtures.md).
