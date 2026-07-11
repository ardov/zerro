# Core Next roadmap

- Updated: 2026-07-11
- Purpose: drive the finishing order; implementation history stays in Git.

## Current position

The normalized entity layer and read projection chain are broadly established.
The session now exposes namespaced `get*` reads over the same memoized nodes,
and `facade/readGraph.ts` records the important dependency edges. Flat
`session.read.*` remains deprecated compatibility.

The budget/goal and transaction legacy write wrappers are removed. App
consumers import narrow Redux adapter commands directly, `TBudgetUpdate` is an
adapter-owned app-facing type, and transaction analytics stay beside UI
actions. Command routing tests live with the Redux adapter. Transaction reads,
classification, sorting, filtering, and presentation remain separate.

Account in-budget and user-settings writes are direct Redux adapter commands as
well. Settings use field-specific intent commands rather than exposing the old
generic `Partial<TUserSettings>` patch contract. FX writes are next and must
preserve the distinction between local hidden-data edits and network loading.

The legacy model write cutover is now complete. FX edit/reset are Core Redux
commands; network loading is an app feature that dispatches them. No production
write call remains on a `*Model` object. Continue with read/helper families,
starting with app-level FX converter/getter consumers; do not mix unrelated
selector families into one slice.

Direct page/feature FX reads now use narrow Redux selectors. Remaining
`fxRateModel` references are internal legacy projection dependencies in goals,
envBalances, and displayCurrency plus parity/export-fixture paths. Retire those
through Core projection cutover; importing the Redux adapter into that graph
would create the wrong dependency direction.

The `fxRateModel` object and barrel are now removed; temporary legacy
projections import their defining FX selectors directly. The next app-facing
FX boundary is `displayCurrency.useToDisplay`, which should become a narrow
Redux selector without making the adapter depend on the legacy display model.

`displayCurrency.useToDisplay` is now removed. UI uses the Core Redux
`useCoreToDisplay` hook, and the adapter owns display-currency selection without
depending on the legacy model. The remaining display-currency setter hook is
the next small app-state bridge.

The display-currency setter is now migrated too, and the legacy model is
deleted. This is a good intermediate verification checkpoint, not completion:
the public baseline is strong, but production still contains legacy model calls
and the opt-in private fixture plus browser smoke remain completion-gate items.

The transaction model object is now removed. Core/Redux owns type, viewed,
ordering, and debt-aware type helpers; filtering is a named temporary bridge to
the legacy defining module. Account read/hooks are the next consumer family.

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

The transaction write family now flows directly from app consumers through the
Redux adapter: delete, permanent delete, restore, mark viewed, update, recreate
(with an id receipt), and bulk edit reuse the existing Core compilers. The
legacy `5-entities/transaction/thunks.ts` file and `trModel` write members are
deleted. Broken `splitTransfer` remains removed with its commented-out consumer.

The entity write cleanup landed smaller than planned: inspection showed
`patchAccount`, `patchTag`, `createTag`, and `patchMerchant` had no app
consumers left (the envelope migration absorbed them), so they were deleted
instead of migrated. The one real use case, `setInBudget`, now dispatches the
semantic `zenmoney.account.inBalance.set` command directly from
AccountContextMenu; its legacy account wrapper is deleted.

The transaction-list bulk actions are now semantic: `combineToOutcome`,
`combineToIncome`, and `mergeAsTransfer` compile in Core
(`compileCombineToOutcome`, `compileCombineToIncome`,
`compileMergeTransactionsAsTransfer`) from selected ids, and the widget
dispatches funnel commands instead of building transaction arrays inline. The
dead `setTagBudget` write and its now-unused `makeTagBudget`/`getBudgetId`
5-entities helpers are removed; `getTagBudgets` (read) stays for parity.

`mergeAccounts` is now semantic too: `compileMergeAccounts(source, target)`
reassigns each source transaction to the target, collapses transfers between
the two accounts into the surviving start balance, reassigns reminders, folds
the source balance into the target, and deletes the source. Equal source and
target ids are rejected. The `4-features/mergeAccounts.ts`
thunk is a thin delegate. It has no UI consumer yet, but the operation is a
distinct known behavior (unlike the deleted redundant patch wrappers), so it
was migrated rather than dropped — the account context menu is its natural
future home.

The unused `legacy.patch` command, `applyLegacyPatch` thunk, adapter export, and
bridge-only tests are removed. A boundary test pins the adapter's supported
command exports. Track E's write cutover and bridge removal are complete.

Replica ownership and package hardening are complete through the adapter/slice
hygiene boundary. Server-like materialization rules remain incomplete.

## Completion plan

The write cutover is done. Two independent reviews of the branch converged on a
finishing order that prioritizes a trustworthy baseline over new architecture.
Do the slices below in order; each is small and independently verifiable.

1. ✅ **Health slice.** Return the suite to green and make local development
   honest before any further change. Fix the three failing tests
   (`selectors.tags.test.ts`, `TagSelect2.test.tsx` init, `fillGoals.test.ts`
   missing `goalType` mock), repair or remove the broken `lint:js` script
   (ESLint 9 with a missing `eslint.config.js`), and apply Prettier across the
   ~52 drifted files. No architectural change. No CI pipeline in this repo yet;
   add only local developer tooling that helps agents keep the baseline green.

2. ✅ **Replay/clone fix.** `cloneDataStore` copies all 11 entity maps on every
   patch and `replayOutbox` replays from `base` on every append, so each write
   invalidates every memoized selector (violates architecture invariant 5).
   Clone only the maps a patch touches; append incrementally
   (`current = applyPatch(current, appliedPatch)`) and keep full replay for undo
   and restore only. Add the missing reference-stability test on the reducer
   replay path that the testing policy already requires for selectors.

3. ✅ **Internal-module decision.** Treat Core Next as an internal app module, not
   a published package yet — there is no external consumer. Stop re-exporting
   the low-level engine from root (`export * from './engine'` contradicts the
   facade-only invariant); keep `engine/outbox.ts` internal to the Redux slice.
   Freeze the session facade; do not widen Track A until a real headless
   consumer exists. Record the decision in the design ledger.

4. ✅ **Adapter and slice hygiene.** Type command receipts instead of `as` casts
   and `AppThunk<any>`; stop exporting the generic `executeCommand` escape
   hatch from the adapter; make `outbox`/`outboxHead`/`base` mandatory in the
   data slice now that the migration is complete; add a runtime validator for
   the persisted replica record so a corrupt outbox fails loudly instead of
   crashing replay on load.

5. ✅ **Documentation and test cleanup.** Mark legacy-parity tests (agreement with
   now-deleted legacy selectors) with an explicit exit condition, like a bridge.
   Compress `handoff.md` to current state plus next step; leave slice history to
   Git. Record the accepted-risk decisions (stale account balance, dirty-session
   sync pause) in the design ledger.

6. **Legacy app-function removal — current.** Switch remaining production
   consumers from legacy model functions to the Redux adapter and delete each
   obsolete function with its last consumer. The target is an app operating
   through a clear Core Redux surface, not Core implementations hidden behind
   legacy wrappers.

7. **Materializer and engine — deferred.** Keep materialization identity-only.
   Implement server-like domain rules and a semantic engine facade only after
   the legacy app-function cutover; neither is a goal of the current refactor.

### Accepted product risks (do not re-litigate)

- **Stale account balances.** Removing the transaction `effects.ts` balance
  updates means `account.balance` can be stale until the next sync; with
  periodic sync paused in a dirty session, that window is now user-visible until
  manual sync. Accepted: balance recomputation is a materializer concern and
  waits for Track C.
- **Dirty-session sync pause.** A dirty session does not pull remote changes
  until the user syncs manually. Accepted as the first product policy despite
  the rebase machinery being capable of more.
- **Undo/redo without UI.** The outbox undo/redo semantics stay even though no
  production control uses them yet; a UI affordance is a planned later slice.

## Active tracks

| Track                           | State                    | Next useful outcome                                                        |
| ------------------------------- | ------------------------ | -------------------------------------------------------------------------- |
| A. Public facade and read graph | Redux adapter in use     | Move remaining app consumers to narrow adapter exports                     |
| B. Domain/presentation boundary | Boundary landed          | Extract an optional appearance package only when a real consumer needs it  |
| C. ZenMoney materializer rules  | Explicitly deferred      | Keep identity-only until legacy app functions are removed                  |
| D. Replica and sync             | Replica boundary live    | Choose a concrete crash-consistency or response-staging need before more D |
| E. Legacy cutover               | Current priority         | Remove one legacy consumer/function family at a time                       |
| F. Package and test hardening   | Root consumer check live | Settle supported subpaths before enforcing their allowlist                 |

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

Next: frozen. Do not widen the session facade or add supported subpaths until a
real headless consumer exists (internal-module decision). The remaining ideas
below are deferred, not scheduled:

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

This track is outside the current refactor. Keep materialization identity-only
until the app uses the Core Redux adapter instead of legacy model functions.
The existing seam is sufficient; do not implement rules merely because the
extension point exists.

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

1. ✅ Extract pure outbox operations: append, drop redo tail, clamp head, replay
   applied prefix, and list pending entries. `createZerroEngine` now reuses
   these internal operations without widening the root package surface.
2. ✅ Reuse them in Redux reducers. Append, undo, and redo rebuild `current`
   from the stored applied prefix; append after undo drops the redo tail. The
   bypassing `applyClientPatch` action is removed.
3. ✅ Move Redux state to logical `base`, `outbox`, `outboxHead`, and derived
   `current`. Runtime outbox/head/current and temporary response staging are
   live. Versioned outbox/head persistence remains separate from the legacy
   ZenMoney entity keys.
4. ✅ Rebase server patches and expose the pending sync payload. Sync captures
   the exact sent entry ids, temporarily stages the canonical response, removes
   only that sent prefix, and replays commands created during the request over
   the updated server base.
5. ✅ Add reload plus undo/redo tests before switching more writes. Reload
   restores pending applied entries over a matching persisted base; stale or
   unknown replica snapshots are discarded safely.
6. ✅ Pause periodic sync whenever the applied outbox prefix is non-empty.
   Clean sessions continue periodic canonical refreshes; dirty sessions wait
   for explicit user synchronization.
7. ✅ Make sync an explicit commit boundary. `prepareClientSync` drops the redo
   tail before payload capture; successful canonical responses remove the exact
   sent ids and preserve commands created in flight, while failures retain the
   applied entries for retry.
8. ✅ Build sync transport directly from the applied outbox prefix. The Redux
   `data.diff` mirror and its timestamp helper are removed; request payload,
   changed count, and before-unload state now derive from outbox selectors.

Accepted lifecycle:

- persisted inputs are `base + outbox + outboxHead`; `current` and request
  transport are derived;
- clean sessions may sync periodically, while the first local command pauses
  periodic sync;
- manual sync drops the redo tail, sends the applied prefix, accepts a
  successful ZenMoney response as canonical, and removes all sent entries;
- there is no product inbox or incoming-change history;
- pending outbox is durable user state, so it is not casually disposable;
- no replica migration framework is added without a concrete format change.

The in-memory engine remains a reference/headless implementation. Do not run it
beside Redux in the app.

Track D has no mandatory mechanical follow-up. Keep cross-key transaction
machinery and technical response-staging simplification deferred until a
concrete failure or user need justifies either one. Choose the next slice from
Track A, E, or F unless work directly touches replica behavior.

## Track E: legacy cutover

Goal: remove compatibility paths only when a real consumer can switch safely.

The semantic command implementations and named bridge retirement are complete,
but the app-function cutover is not. `mergeAccounts` has
explicit transaction, reminder, and internal-transfer semantics; the unused
`legacy.patch` command and `applyLegacyPatch` thunk/export are deleted; and the
adapter command surface is pinned by a boundary test. Reminder writes now use
semantic commands; data-account bootstrap and the debug API use explicit
infrastructure entries through the cycle-safe executor. No production caller
dispatches `applyClientPatch` directly. Some app consumers still call legacy
model wrappers that delegate to Core; move them to narrow adapter exports and
delete the wrappers. Other compatibility work includes:

- deep app imports from `core-next/zenmoney`, `core-next/zerro`, and tag
  presentation shims;
- compatibility re-exports under `6-shared/types`, demo data, and icon assets.

The first concrete adapter cleanup moved reminder writes, hidden data-account
preparation, the debug patch hook, and tag-presentation shims behind
`core-next/adapters/redux`. The data-account command is
`infrastructure.dataAccount.prepare@2`, so its semantic title is present in
the persisted command payload. A follow-up moved the remaining goal and Stats
helpers behind that same adapter and added a production-source guard against
new implementation-subpath imports. Keep the compatibility facades as
separate, consumer-led slices.

Switch one path at a time. Add parity or invalidation coverage appropriate to
that path, then update its bridge entry in the design ledger.

## Track F: package and tests

Goal: keep the package boundary trustworthy while migration continues.

Useful slices:

1. ✅ Generate declarations and compile a tiny external consumer using only
   the supported root entrypoint. `pnpm core-next:package-check` emits into a
   temporary package, then type-checks a consumer importing `core-next`.
2. Enforce allowed subpaths once their list is settled.
3. Add demo scenarios only for genuinely distinct domain shapes.
4. Keep private fixture runs opt-in and privacy-safe.
5. Add dependency-direction checks for foundational type modules if barrel
   cycles continue to obscure the graph.

Do not add tests for trivial map lookups or speculative APIs.

## Choosing work

Follow the current legacy app-function removal goal above. The tracks below
remain vocabulary for classifying a slice:

- Track B when working on tags, envelopes, icons, localization, or bank
  appearance.
- Do not choose Track C during the current refactor; materializer rules and the
  engine facade are later phases after legacy removal.
- Track D when changing sync, undo/redo, persistence, or Redux data state.
- Track E for a single concrete app consumer.
- Track F stays limited to the existing package-check; do not enforce subpath
  allowlists while Core Next is an internal module.

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
