# 5-entities cleanup plan

- Updated: 2026-07-20
- Status: completed
- Scope: `src/5-entities`, its consumers, and the `zerro-core/redux` adapter surface
- Rule: one independently verified step per commit

`5-entities` is residue from the migration into `zerro-core`. It currently mixes
three unrelated kinds of code: empty re-export shims, real duplicates of core
logic, and a small amount of genuine React presentation. This document records
the order for removing the first two and the boundary that keeps the third
honest.

Baseline at the time of writing: `npx tsc --noEmit` passes, 39 files in
`src/5-entities`, `pnpm knip` reports one unused file and 12 unused exports
inside the layer.

## The boundary

- **`zerro-core`** owns "what is true about the user's finances": domain types,
  id encoding, derivations, command compilation, and the Redux adapter that
  binds them to the store. No React.
- **`5-entities`** owns only React bindings to core: components and hooks. No
  business logic, no knowledge of how data is stored in reminder comments, no
  redefinition of core types.

Consequence: `EnvType`, `envId`, `goalType`, `HiddenDataType`,
`envelopeVisibility`, `TEnvelopeMeta`, `TBalanceNode` all live in core, and
`5-entities` neither redefines nor re-exports them.

## What is duplicated today

| `5-entities`                                          | core equivalent                               | nature                                      |
| ----------------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| `envelope/shared/envelopeId.ts`                       | `domain/zerro/envelope-id/envelopeId.ts`      | identical source                            |
| `shared/hidden-store/types.ts`                        | `domain/zerro/hidden-data/types.ts`           | identical `HiddenDataType` enum             |
| `goal/shared/types.ts`                                | `domain/zerro/goals/types.ts`                 | identical `goalType` / `TGoal`              |
| `envelope/shared/metaData.ts`                         | `domain/zerro/envelope-meta/*`                | duplicated types and write path             |
| `accBalances/shared/*`                                | `domain/zenmoney/balances.ts`                 | `convertBalancesToDisplay` duplicated whole |
| `shared/hidden-store/{simple,monthly}StoreFactory.ts` | `domain/zerro/hidden-data/{read,write}.ts`    | two independent writers into one store      |
| `userSettings/userSettings.ts`                        | `core.settings.select`                        | duplicated selector                         |
| `budget/envBudget/*`                                  | `core.budgets.selectAll` / `core.budgets.set` | duplicated read and write                   |

The hidden-store duplication is the one with behavioural weight. Core's
`compileSetSimpleHiddenData` merges the data-account patch and the reminder
patch into a single `TIntentPatch`. The legacy factory at
`src/5-entities/shared/hidden-store/simpleStoreFactory.ts` dispatches
`prepareDataAccount()` and `setReminder(...)` separately, producing two commands
and two outbox entries for the same logical write. Same storage, two writers,
different atomicity.

## Completed order

### 1. Close the adapter gap

Nothing is deleted in this step; it only makes the later deletions possible.

- Re-export `TEnvelopeId` and `envelopeVisibility` from
  `src/zerro-core/redux/envelopes.ts`. Both exist in
  `domain/zerro/envelope-id` and `domain/zerro/envelope-meta`, but the redux
  namespace does not surface them, which is the only reason
  `5-entities/envelope/index.ts` still exists.
- Add a selector for the raw ZenMoney `budget` slice
  (`state.data.current.budget`) to `src/zerro-core/redux/state.ts` and expose it
  through the `budgets` namespace. This is the legacy ZM budget entity consumed
  by the ZM→Zerro conversion, and is distinct from `core.budgets.selectAll`,
  which reads derived Zerro budgets from the graph.

Exit: typecheck, lint, tests, and `zerro-core:package-check` pass. No behaviour
change.

### 2. Delete code with no consumers

Verified unused by both `pnpm knip:exports` and a repo-wide grep:

- `src/5-entities/envelope/shared/metaData.ts` — `getEnvelopeMeta` and
  `patchEnvelopeMeta` have zero consumers. Note that
  `src/4-features/envelope/createEnvelope.test.ts` already imports
  `getEnvelopeMeta` from `zerro-core/domain/zerro`, not from here. After step 1,
  point `envelope/index.ts` at `core.envelopes.envelopeVisibility`.
- `src/5-entities/goal/goalStore.ts` — `goalStore` and `getRawGoals` unused;
  `core.goals.selectRawGoals` is the live equivalent. Drop the `getRawGoals`
  re-export from `goal/index.ts`.
- `src/5-entities/tag/ui/TagSelect.tsx` — whole file unused. The `TagSelect`
  rendered by `2-pages/Review/cards/NotFunCard` is a different, local component.
- `src/5-entities/accBalances/useBalances.ts` — stop exporting `useBalances`;
  only `useDisplayBalances` has a consumer.

Exit: typecheck, lint, tests pass; `pnpm knip` reports no unused files in
`5-entities`.

### 3. Move the last two legacy consumers onto core

- `src/4-features/budget/convertZmBudgetsToZerro.ts` uses `setEnvBudget` from
  the legacy store while already typing its return as
  `core.budgets.TBudgetUpdate[]`. Switch the write to `core.budgets.set` and the
  read to the ZM budget slice selector added in step 1.
- `src/5-entities/tag/model/model.ts` builds
  `createSelector([getTags, getUserSettings], populateTags)`, which is exactly
  `core.tags.selectPopulated`. Use the core selector.

Then delete, now orphaned:

- `src/5-entities/userSettings/` (replaced by `core.settings.select`)
- `src/5-entities/budget/` (all six files)
- `src/5-entities/tag/model/makeTag.ts` and `populateTags.ts` (pure re-exports)

Exit: typecheck, lint, tests pass. Confirm by hand that a budget conversion and
a settings toggle still round-trip, since this step changes a write path.

### 4. Delete the legacy hidden-store and reminder modules

After step 3 these have no remaining consumers.

- `src/5-entities/shared/hidden-store/` — six sources plus
  `dataAccount.test.ts`. Coverage already exists in
  `domain/zerro/hidden-data/{read,write}.test.ts` and
  `domain/zerro/accounts/{read,commands}.test.ts`.
- `src/5-entities/reminder/` — four files. `setReminder.ts` is a two-line
  re-export of `core.reminders`; check whether `setReminder.test.ts` asserts
  anything not covered by the core reminder command tests before dropping it,
  and port whatever is unique.

This also removes the import-cycle workaround documented in
`monthlyStoreFactory.ts` and `shared/hidden-store/index.ts`, which exists only
because that layer tried to be both model and adapter.

Exit: typecheck, lint, full test suite pass; test count drops only by the
deleted duplicate assertions.

### 5. Remove the remaining type copies

- `src/5-entities/envelope/shared/envelopeId.ts` → `core.envelopes`
- `src/5-entities/goal/shared/types.ts` → `core.goals`
- `src/5-entities/accBalances/shared/types.ts` and
  `convertBalancesToDisplay.ts` → `domain/zenmoney/balances` exports
  `TBalanceNode`, `TBalanceState`, and `convertBalancesToDisplay` already.

Exit: typecheck, lint, tests pass; no enum or type in `5-entities` shadows a
core one.

### 6. Rewrite consumer imports

Roughly 40 files import from `5-entities/envelope`, mostly `TEnvelope`,
`TEnvelopeId`, `EnvType`, and `envelopeVisibility`. Move them to
`core.envelopes.*`, then delete `src/5-entities/envelope/index.ts` and
`src/5-entities/goal/index.ts` (the latter has a single consumer,
`2-pages/Budgets/GoalPopover/GoalPopover.tsx`).

Keep this step mechanical and separate from every other change so the diff stays
reviewable.

Exit: typecheck, lint, tests, build pass; no import of `5-entities/envelope` or
`5-entities/goal` remains.

### 7. Decide what the layer is for

What survives is genuine React presentation:

- `currency/displayCurrency/` — `DisplayAmount`, used in 15 files across pages,
  widgets, and features. Earns its place at this layer.
- `tag/ui/` — `TagChip`, `TagList`, `TagSelect2`, consumed only by
  `3-widgets/transaction`. Consider moving it there and dropping the `tag`
  entity.
- `accBalances/useBalances.ts` — `useDisplayBalances`, one consumer
  (`2-pages/Stats/WidgetNetWorth`). Consider inlining.
- `tag/model/model.ts` — `getTagsTree`, already marked deprecated in the source
  and used only by `TagSelect2`. Fold it into that component.

This step is a judgement call, not a mechanical one; leave it until steps 1–6
have landed and the real shape is visible.

## Verification gates

Run for every step:

```
npx tsc --noEmit
pnpm lint:js
pnpm test
pnpm knip
pnpm zerro-core:package-check
```

Add `pnpm build` before the final commit of the series.

## Outcome

37 of 39 files in `src/5-entities` were removed. The layer now contains only
`DisplayAmount` and its index. Tag presentation moved to its sole owner under
`3-widgets/transaction`, and the one-off display-balance hook moved into
`WidgetNetWorth`.

The only intended production behavior change is step 3, which consolidates the
budget write onto the single Core command path. Browser smoke also exposed and
fixed the React 19 `CSSTransition` boundary in the affected bulk toolbar.
