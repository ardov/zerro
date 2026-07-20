# Zerro Core simplification plan

- Created: 2026-07-20
- Owner: solo maintainer
- Purpose: reduce zerro-core to the simplest shape that still supports two
  futures: evolving entities and extracting the engine as a standalone package.

## Principles

1. Clarity of structure and code beats clever forward-looking architecture.
2. Clarity beats piles of micro-tests; a test dies with the code it protected.
3. Unused exports are deleted, not preserved as "API candidates" — git
   remembers.
4. Expected net result: roughly −1.5–2k lines of code and about half the file
   count, with no behavior change.

## Do not touch

- `application/session/createZerroSession.ts` — the future package API; its
  lazy memo graph is the readable dependency documentation.
- The session/reselect double wiring — deliberate price for the future package.
- `applyPatch`, `infrastructure/replica/outbox.ts`, `domain/zerro` projections.
- `testing/` helpers — used by app tests outside core.

## Workstreams

### W1. Small dups and dead code — wave 1, done 2026-07-20 (−246/+55 lines)

- Dedupe the localized labels cache: `redux/envelopes.ts#selectLabels` and
  `redux/commandRead.ts#getCommandEnvelopeLabels` are identical; keep one.
- Single `isCompiled` helper (now copied in `redux/commands.ts`,
  `redux/executeCommand.ts`, `infrastructure/replica/createZerroEngine.ts`).
- Remove the `populateTags` alias of `presentTags`.
- Remove the dead `inbox` field from `createZerroEngine` state and the unused
  `_sourceCommand` parameters in `executeReduxCommand`/`executeCompiled`.
- Remove dead app commands `zenmoney.transaction.update` and
  `zenmoney.transaction.viewed.set` (union + switch) and, if then unused in
  production, `compileApplyChangesToTransaction` /
  `compileMarkTransactionsViewed` with their tests.
- Delete knip-confirmed dead core exports (un-export when used internally):
  `intentEntityKeys`, shared/date `nextDay/nextYear/isISODate/toGroup/
nextGroup`, money `add/sub`, `populateAccount`, `getUsers`,
  `uncategorizedTagId`, `normalizeGoal`,
  `transactionEditableFields`/`transactionRecreateFields`, `EnvActivity`
  re-export, redux `patchTransactions`/`transactions.patch` exports,
  `stableStringify`, `usdInstrument`.

### W2. Documents diet — wave 1, done 2026-07-20 (1501 → 966 doc lines)

- `architecture.md`: compress to ~200 lines (boundaries, invariants, change
  pipeline); delete the 100-line Mermaid projection graph (the session file is
  the graph).
- Merge `roadmap.md` + `handoff.md` + `cleanup-notes.md` into one working
  notes file; command shape stays documented in exactly one place.
- Keep `design-ledger.md` (most valuable doc) and `testing.md`.

### W3. Sparse intent compilers — wave 2, done 2026-07-20

Domain compilers return sparse patches (`{ id, ...changedFields }`) instead of
full entities; `compileIntentPatch` already re-sparsifies, so the
`{...current, ...patch, changed: now()}` merges are dead work
(`changed` is explicitly ignored at materialization).

- `compilePatchAccount/Tag/Merchant` are three copies of one function: collapse
  or remove (the sparse-direct path `executeReduxPatch` already exists —
  `patchTransactions` uses it).
- `transactions/commands.ts`: drop `...getExistingTransaction(...)` spreads —
  e.g. delete becomes `{ id, deleted: true }`.
- Remove `ctx.now()` from compiler signatures where it becomes unused.

Account, tag, merchant, reminder, budget, hidden-data, envelope, and
transaction compilers now return sparse intent. `applyPatch` applies sparse
fields as a dumb merge for compiler composition and tests; only the
materializer adds factory defaults, timestamps, and deletion protocol metadata.

### W4. Entity registry in the materializer — wave 2

`materializeCommand.ts` (609 lines) holds six near-identical triples of
`compact*Creation` / `materialize*Creation` / `compileIntentPatch` blocks.
Replace with one per-entity table
`{ key, make, writableFields, requiredFields, creationFields? }` plus three
generic functions. Special cases (budget id check, transaction field filter and
deleted-guard) stay as per-row hooks. Adding an entity becomes a one-row
change; the `as unknown as` casts disappear.

### W5. Collapse TAppCommand layer — wave 3

Each command lives three times (union member, switch case, wrapper). Wrappers
are the only production entry and the union is never serialized (durable form
is `type: 'patch'`). Make each wrapper call `executeReduxCommand` with its own
compile closure directly; delete the union and switch.

### W6. One file per small entity — wave 3

Collapse `merchants`, `users`, `instruments`, `countries`, `companies`,
`budgets`, `reminderMarkers` (5–7 files each) into one `<entity>.ts` per
entity; merge their mini-READMEs into `domain/zenmoney/README.md`. Keep
folders for transactions, envelopes, activity, accounts, tags, reminders if
they stay multi-file. Naming cleanup: keep two patch words (`TIntentPatch`
sparse, `TNormalizedPatch` full), retire the `TDiff` alias.

## Verification gate (every wave)

- `pnpm exec vitest run` — default parallel run must pass.
- `npx tsc --noEmit`
- `pnpm exec knip` — no new findings in core.
- `pnpm run zerro-core:package-check` after W3–W6.
