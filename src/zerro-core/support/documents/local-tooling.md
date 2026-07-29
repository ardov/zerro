# Local finance tooling MVP

- Status: implementation active; W-1 complete
- Updated: 2026-07-29
- Scope: a local CLI first, with an optional MCP adapter after the CLI contract
  is stable

## Goal

Build a small local tool that lets an agent:

1. refresh and inspect the user's normalized ZenMoney snapshot;
2. list accounts and search a bounded transaction history;
3. read monthly totals, budgets, goals, balances, and debtors through Zerro
   Core projections;
4. preview a transaction creation or edit without changing local state;
5. explicitly stage an accepted change into the existing Core outbox;
6. inspect and undo staged changes;
7. explicitly synchronize the staged outbox with ZenMoney.

The MVP is a source consumer inside this repository. It does **not** publish or
physically move `zerro-core`. It proves the headless boundary before a package
split is considered.

## Starting point

Do not replace these existing contracts:

- `createZerroSession(data, ctx)` is the immutable read facade.
- Durable replica truth is `base + outbox`; `current` is replayed from them.
- `redo` is session-only and is never persisted.
- Commands are the closed sparse `TCommand` patch shape documented in
  [architecture.md](./architecture.md#commands).
- `buildOutboxTransport` rematerializes primary intent from `base`; predicted
  local effects must not enter transport.
- A successful ZenMoney response acknowledges exactly the sent outbox prefix.
  The accepted whole-prefix and silent-drop risk remains unchanged for this
  MVP.
- Canonical server diffs update `base`; remaining commands replay over the new
  base.

Useful current seams:

- `src/zerro-core/index.ts` — package-safe snapshot session and root types;
- `src/zerro-core/replica.ts` — explicit current-app replica integration;
- `src/zerro-core/internal/operations/replication/outbox.ts` — the only
  append/undo/redo/replay/transport implementation;
- `src/6-shared/api/zenmoney/fetchDiff.ts` — HTTP diff exchange;
- `src/6-shared/api/zm-adapter/converters.ts` — wire/normalized conversion;
- `src/zerro-core/internal/domain/zerro/transactions/query.ts` — canonical
  transaction filtering;
- `src/zerro-core/internal/projections/graph.ts` — shared financial projections.

## Accepted MVP decisions

### Keep

- one deterministic Core command/outbox path;
- semantic transaction inputs rather than a public generic patch tool;
- preview by default and an explicit stage action;
- an explicit sync action;
- bounded JSON output with stable versioned envelopes;
- atomic local state-file replacement;
- token omission from stdout, persisted state, and error objects;
- existing default parallel Core verification gates.

### Simplify

- keep Core under `src/zerro-core`;
- run the TypeScript CLI from the repository instead of publishing a package;
- support one local profile and one endpoint at a time;
- read the token only from `ZERRO_TOKEN`;
- store one JSON document instead of IndexedDB, SQLite, or multiple domain
  files;
- do not persist proposals: preview is a pure response, and `--stage` reruns
  the same semantic request against the latest local state;
- do not add roles, capability negotiation, an audit database, redaction
  profiles, a daemon, or a network listener;
- assume a single writing process; document that concurrent `stage`, `undo`,
  and `sync` are unsupported in the MVP;
- defer a generalized satisfaction checker, rejected-command quarantine, and
  automatic retry;
- defer transaction balance prediction; a preview must say that canonical
  balances may change after sync.

### Non-goals

- sharing the browser's IndexedDB replica with the CLI;
- keeping browser and CLI undo stacks in lockstep;
- OAuth or token refresh;
- automatic sync during a read or preview;
- raw `TDataStore` dumps as the primary agent API;
- a public `applyRawPatch` or arbitrary entity mutation tool;
- account, tag, merchant, budget, reminder, or envelope creation in the first
  write slice;
- bulk autonomous cleanup or recategorization;
- a remotely reachable MCP or HTTP server;
- solving multi-process or multi-profile concurrency;
- physically extracting or publishing an npm package.

## Target boundary

```txt
pnpm zerro -- <command>
          |
          v
tools/zerro/src/cli.ts
          |
          v
tools/zerro/src/application/*
    |                  |
    v                  v
zerro-core/headless    tools/zerro/src/adapters/*
pure reads/commands    state file + ZenMoney HTTP
```

CLI parsing, filesystem access, environment variables, HTTP, and JSON
presentation stay under `tools/zerro`. Core remains unaware of Node, the CLI,
MCP, tokens, paths, and persistence.

The tool may initially reuse the existing `6-shared/api` wire converter and
ZenMoney client because it is an in-repository consumer. Moving those modules
behind a neutral adapter is a follow-up only if browser and CLI use becomes
awkward.

## Runtime state

Persist exactly one document:

```ts
type TLocalToolState = {
  version: 1
  endpoint: 'ru' | 'app'
  base: TDataStore
  outbox: TCommand[]
}
```

Rules:

- `current = replayOutbox(base, outbox)` after every load;
- never persist `current`, `redo`, token, derived projections, sync status, or
  preview data;
- use `ZERRO_STATE_PATH` when set;
- otherwise resolve the default state path from `node:os.homedir()` rather than
  relying on shell expansion;
- create the parent directory on first write;
- write a complete temporary sibling file and rename it over the target;
- reject an unknown state version or malformed Core outbox;
- validate that `base` has a finite timestamp and an object map for every
  normalized entity family; deep entity-field validation is outside MVP because
  the tool is the only writer;
- an absent file means an empty base and outbox, not a partially initialized
  state;
- `refresh` with cursor `0` bootstraps the first full snapshot;
- no command may write the state file if its operation fails.

The first implementation may state that concurrent writers are unsupported.
Atomic rename still protects against a truncated file after a crash.

## Mutation model

There are only three user-visible states:

```txt
preview    pure before/after response; nothing is stored
stage      one or more Core commands are appended to outbox
sync       the current outbox prefix is sent and acknowledged
```

There is no proposal id or proposal store.

Preview and stage accept the same semantic input. Stage recompiles against the
latest `current`; it must not accept a materialized patch copied from a previous
preview. Generated ids and timestamps are created only during stage. A preview
may return `generatedId: null` because it is not replay state.

The CLI must not combine stage and sync in one command. This keeps a visible
inspection boundary even in the simplified MVP:

```bash
pnpm zerro -- transaction create --input expense.json
pnpm zerro -- transaction create --input expense.json --stage
pnpm zerro -- outbox
pnpm zerro -- sync
```

## Stable output contract

Human output may be added later. MVP commands emit JSON on stdout and
diagnostics on stderr.

Every successful command returns:

```ts
type TOk<T> = {
  schemaVersion: 1
  ok: true
  command: string
  asOf: string
  baseServerTimestamp: number
  pendingCommandCount: number
  data: T
}
```

Every expected failure returns:

```ts
type TFailure = {
  schemaVersion: 1
  ok: false
  command: string
  error: {
    code: string
    message: string
    details?: unknown
  }
}
```

Conventions:

- exit `0`: success;
- exit `2`: invalid CLI input;
- exit `3`: missing or ambiguous entity reference;
- exit `4`: missing state or token;
- exit `5`: local validation or Core command rejection;
- exit `6`: ZenMoney/network sync failure;
- never put stack traces, tokens, request headers, or unbounded server bodies in
  stdout JSON;
- default list limit is `50`; maximum is `200`;
- pagination is an opaque offset/cursor owned by the tool;
- money values remain numbers in their original instrument and include the
  instrument id, code, and symbol when available;
- timestamps in output use ISO strings, while Core state keeps normalized
  milliseconds;
- include stable ids even when a human title is present.

## Planned CLI surface

### State and refresh

```bash
pnpm zerro -- status
pnpm zerro -- refresh
```

`status` is local-only and returns:

- whether a state file exists;
- endpoint;
- base timestamp;
- account and transaction counts;
- pending command count;
- last command timestamp;
- whether a token is available, as a boolean only.

`refresh` sends no local mutation intent. It:

1. loads `base + outbox`;
2. computes the same one-second-overlap cursor as the app;
3. sends a diff request with no transport entities;
4. converts and applies the canonical patch to `base`;
5. replays the unchanged outbox;
6. atomically persists the new `base + outbox`.

### Reads

```bash
pnpm zerro -- accounts
pnpm zerro -- transactions --from 2026-07-01 --to 2026-07-31
pnpm zerro -- transactions --search taxi --account <id> --limit 50
pnpm zerro -- month 2026-07
pnpm zerro -- budgets
pnpm zerro -- goals
pnpm zerro -- debtors
```

Read rules:

- use `current`, so staged local changes are visible;
- report `pendingCommandCount`, so the caller knows the snapshot is not fully
  canonical;
- do not call `refresh` implicitly;
- use `createZerroSession` for projections;
- use Core transaction-query semantics rather than a second hand-written
  predicate;
- join account, tag, merchant, and instrument labels at the application
  boundary;
- page transaction rows after filtering and stable Core ordering;
- omit raw normalized collections that the command did not request.

Minimum account row:

```ts
type TAccountRow = {
  id: string
  title: string
  type: string
  archive: boolean
  inBalance: boolean
  balance: number
  instrument: { id: number; code: string; symbol: string }
}
```

Minimum transaction row:

```ts
type TTransactionRow = {
  id: string
  date: string
  type: 'income' | 'outcome' | 'transfer' | 'incomeDebt' | 'outcomeDebt'
  income: TMoneySide
  outcome: TMoneySide
  tags: Array<{ id: string; title: string }>
  merchant: { id: string; title: string } | null
  payee: string | null
  comment: string | null
  deleted: boolean
  viewed: boolean
}
```

`month` returns the existing Core month total plus a compact budget and
envelope summary. It must not invent a second accounting calculation.

### Preview and stage

```bash
pnpm zerro -- transaction create --input <path-or-stdin>
pnpm zerro -- transaction create --input <path-or-stdin> --stage
pnpm zerro -- transaction update <id> --input <path-or-stdin>
pnpm zerro -- transaction update <id> --input <path-or-stdin> --stage
pnpm zerro -- outbox
pnpm zerro -- undo
```

The first write slice supports:

- create expense;
- create income;
- create same- or cross-instrument transfer;
- update date, money sides, accounts, tags, merchant, payee, and comment on an
  existing transaction;
- soft delete may be added only after create/update are complete and verified.

Human account/tag/merchant title resolution is optional in the first slice.
Inputs must always accept stable ids. If title resolution is added:

- exact id wins;
- exactly one normalized exact title match is accepted;
- zero matches returns candidates only when bounded;
- multiple matches is an error; never choose the first match.

`--input <path>` reads one JSON object from a file. `--input -` reads one JSON
object from stdin. Inline JSON CLI arguments are deliberately unsupported so
shell quoting cannot become a second input format.

## Semantic transaction creation

Add one Core compiler beside the existing transaction commands:

```ts
type TCreateTransactionInput =
  | {
      kind: 'expense'
      accountId: TAccountId
      amount: number
      date: TDateDraft
      tagIds?: TTagId[]
      merchantId?: TMerchantId | null
      payee?: string | null
      comment?: string | null
    }
  | {
      kind: 'income'
      accountId: TAccountId
      amount: number
      date: TDateDraft
      tagIds?: TTagId[]
      merchantId?: TMerchantId | null
      payee?: string | null
      comment?: string | null
    }
  | {
      kind: 'transfer'
      outcomeAccountId: TAccountId
      incomeAccountId: TAccountId
      outcome: number
      income?: number
      date: TDateDraft
      comment?: string | null
    }
```

Compiler rules:

- require a root user;
- require every referenced account, tag, and merchant;
- require finite positive monetary amounts;
- reject a transfer to the same account;
- derive each side's instrument from its account;
- expense uses the selected account for both normalized account fields, sets
  `outcome = amount`, and sets `income = 0`;
- income uses the selected account for both normalized account fields, sets
  `income = amount`, and sets `outcome = 0`;
- same-instrument transfer defaults `income` to `outcome`;
- cross-instrument transfer requires an explicit positive `income`;
- capture id, `created`, `changed`, user, and all factory defaults at issue
  time;
- return `{ patch, receipt: { transactionId } }`;
- use `makeTransaction`; do not recreate its defaults in the tool;
- verify resulting materialized state, not only patch shape;
- keep account balance prediction out of this first compiler. The canonical
  response will update balances after sync, and previews must disclose that.

The Redux adapter does not need a create UI to consume this compiler. It should
remain a Core command that the headless consumer proves.

## Headless Core source entrypoint — W-1 complete

`src/zerro-core/headless.ts` is the explicit non-Redux source boundary. Keep it
explicit; do not export internal barrels.

Planned surface:

```ts
export {
  createZerroSession,
  createEmptyDataStore,
  issuePatch,
  compileCreateTransaction,
  compileTransactionQuery,
  appendOutbox,
  undoOutbox,
  redoOutbox,
  replayOutbox,
  buildOutboxTransport,
  acceptCanonicalPatch,
  getSyncCursor,
  parsePersistedReplica,
}
```

Names may follow the actual owners, but the capabilities are fixed:

- create an empty normalized base;
- create reads over a frozen snapshot;
- compile a semantic transaction;
- issue and append the resulting durable command;
- query transactions with Core semantics;
- accept a canonical patch and optionally acknowledge a sent prefix;
- replay and construct transport;
- validate persisted outbox input.

`acceptCanonicalPatch` belongs with the replica operations. It must apply the
canonical server patch to `base`, remove exactly `sentOutboxCount`, and replay
the remaining outbox. The CLI and Redux must not grow different
acknowledgement/rebase implementations. It is acceptable to add the pure
operation first and migrate the Redux reducer to it in the same or immediately
following checkpoint.

Update `api-boundary.test.ts` so `zerro-core/headless` is an allowed explicit
entrypoint and so no tool imports `zerro-core/internal/*`.

## Sync algorithm

`sync` is explicit and single-process:

1. load and validate local state;
2. fail before network access when `ZERRO_TOKEN` is missing;
3. capture `sentOutboxCount = outbox.length`;
4. compute `sentAt`;
5. build primary-only transport from `base` and the captured outbox;
6. add the same overlap cursor used by `refresh`;
7. convert to the ZenMoney wire shape and call `/v8/diff/`;
8. on any thrown or error response:
   - leave the state file byte-for-byte unchanged;
   - return a bounded failure;
9. on success:
   - apply the canonical patch to `base`;
   - remove exactly the captured prefix;
   - replay any remaining commands;
   - atomically persist the result;
10. return changed-domain counts and the remaining outbox count.

The MVP intentionally accepts the app's whole-prefix acknowledgement risk. Do
not invent command ids, per-field acknowledgements, quarantine, or retries.

After a successful create sync, the command response should confirm whether the
created transaction id appeared in the canonical response. If it did not, emit
a warning; do not add a second automatic request in the first implementation.

`refresh` and `sync` must share cursor, HTTP, conversion, canonical-acceptance,
and persistence helpers. They must not be two orchestration implementations.

## Implementation waves

Each wave is a separate reviewable commit unless a tiny adjacent documentation
change clearly belongs with its implementation. Do not start a later wave until
the current exit gate passes.

### W-1 — Headless Core readiness — complete

Goal: finish the pure Core capabilities that every local adapter must share
before the first CLI file exists.

Completed:

1. Added `createEmptyDataStore`.
2. Added pure `acceptCanonicalPatch` with refresh preservation and exact
   sent-prefix acknowledgement.
3. Moved the one-second cursor overlap to pure `getSyncCursor`.
4. Migrated Redux canonical acceptance, empty-state creation, and cursor
   selection to those Core operations; removed the duplicate mutable diff
   implementation.
5. Added `compileCreateTransaction` for expense, income, same-instrument
   transfer, and cross-instrument transfer with reference and amount
   validation.
6. Added `session.transactions.query` over the canonical Core transaction
   filter and routing context.
7. Added the explicit `zerro-core/headless` source entrypoint and pinned its
   boundary.
8. Added `core.transactions.create(input)` as the Redux semantic wrapper over
   the same compiler, with receipt, durable outbox, and resulting-state
   coverage.

Exit evidence:

- full Vitest suite passes: 97 files and 385 tests;
- `pnpm typecheck` passes;
- `pnpm lint:js` and `pnpm knip` pass;
- `pnpm zerro-core:package-check` passes;
- Redux and the future local tool share canonical acceptance and cursor rules.

### W0 — Tool skeleton and deterministic fixtures

Goal: establish a Node-only consumer without changing Core behavior.

Files:

- `tools/zerro/tsconfig.json`
- `tools/zerro/src/cli.ts`
- `tools/zerro/src/application/output.ts`
- `tools/zerro/src/application/context.ts`
- `tools/zerro/src/cli.test.ts`
- `package.json`
- `knip.json`

Steps:

1. Add a repository script:

   ```json
   "zerro": "tsx tools/zerro/src/cli.ts"
   ```

2. Add `tsx` as the sole execution dependency if it is not already available.
   Do not add a CLI framework; use `node:util.parseArgs`.
3. Add a tool typecheck script and include it in `pnpm typecheck`.
4. Add the CLI entrypoint to Knip.
5. Implement only `help` and `status` against an injected in-memory empty
   state.
6. Put `// @vitest-environment node` on Node adapter tests.
7. Freeze the success/failure JSON envelope with tests.

Exit:

- `pnpm zerro -- help` exits `0`;
- `pnpm zerro -- status` returns valid versioned JSON;
- no browser global is touched;
- TypeScript, focused tests, API boundary, and Knip pass.

Suggested commit:

```txt
feat(zerro-tool): add local CLI skeleton
```

### W1 — Atomic state file and local status

Goal: persist and restore `base + outbox` without network access.

Files:

- `tools/zerro/src/adapters/stateFile.ts`
- `tools/zerro/src/adapters/stateFile.test.ts`
- `tools/zerro/src/application/workspace.ts`
- `tools/zerro/src/application/status.ts`
- `src/zerro-core/headless.ts`
- `src/zerro-core/api-boundary.test.ts`

Steps:

1. Consume the existing explicit headless source entrypoint and extend it only
   if this wave proves a missing capability.
2. Define state version `1`.
3. Implement absent-file bootstrap, validation, load, and atomic save.
4. Derive `current` on load.
5. Return status counts from both base and current where useful.
6. Test malformed JSON, unknown version, invalid outbox, missing parent
   directory, and write failure.
7. Prove that the tool imports only declared Core entrypoints.

Exit:

- a persisted outbox replays identically after reload;
- redo/current are absent from the file;
- an interrupted or failed write does not replace the previous valid state;
- package and boundary checks remain green.

Suggested commit:

```txt
feat(zerro-tool): persist the local Core replica
```

### W2 — Read-only refresh

Goal: bootstrap and incrementally refresh one local snapshot.

Files:

- `tools/zerro/src/adapters/zenmoney.ts`
- `tools/zerro/src/adapters/zenmoney.test.ts`
- `tools/zerro/src/application/refresh.ts`
- a shared pure cursor helper under the existing replica/sync owner
- app selector changes required to reuse that cursor helper

Steps:

1. Inject `fetch` and token lookup in tests; never use a real token in the
   default suite.
2. Reuse the existing endpoint table and diff converter.
3. Remove or inject the converter's performance logging so it can never write
   into the CLI's JSON stdout.
4. Reuse Core `getSyncCursor`.
5. Reuse Core `acceptCanonicalPatch`.
6. Make `refresh` send no transport entities.
7. Apply the canonical patch and replay the unchanged outbox.
8. Persist only after a successful normalized response.
9. Cover full bootstrap, incremental refresh, remote deletion, outbox rebase,
   HTTP failure, malformed response, and missing token.

Exit:

- an empty state becomes a valid full snapshot from a fixture response;
- a second refresh uses the overlap cursor;
- a failed refresh leaves the state file unchanged;
- pending commands survive and replay over a refreshed base.

Suggested commit:

```txt
feat(zerro-tool): refresh a local ZenMoney snapshot
```

### W3 — Agent-oriented reads

Goal: answer useful finance questions without exposing an unbounded raw store.

Files:

- `tools/zerro/src/application/accounts.ts`
- `tools/zerro/src/application/transactions.ts`
- `tools/zerro/src/application/month.ts`
- `tools/zerro/src/application/present.ts`
- corresponding focused tests
- session/query public wiring where required

Steps:

1. Implement `accounts`.
2. Use the existing Core transaction query semantics through the
   headless/session boundary.
3. Implement bounded `transactions` with date, search, account, tag, type,
   deleted mode, limit, and cursor.
4. Implement `month` from the existing month, budget, envelope, and activity
   projections.
5. Add `budgets`, `goals`, and `debtors` only as thin projection formatting.
6. Include stable ids and human labels.
7. Verify staged outbox changes are visible because reads use `current`.
8. Add a representative large fixture test that asserts output remains bounded.

Exit:

- another agent can list accounts, find a transaction, and summarize one month
  using only CLI help and JSON output;
- no query returns more than the configured maximum;
- read results match `createZerroSession` and Core query results.

Suggested commit:

```txt
feat(zerro-tool): expose bounded finance reads
```

This is the first useful read-only MVP checkpoint.

### W4 — Semantic transaction creation

Goal: preview and stage a new expense, income, or transfer.

Files:

- `src/zerro-core/internal/domain/zenmoney/entities/transactions/commands.ts`
- its focused command tests
- `src/zerro-core/headless.ts`
- `tools/zerro/src/application/transactionCreate.ts`
- `tools/zerro/src/application/transactionCreate.test.ts`
- CLI parser tests

Steps:

1. Use the existing `TCreateTransactionInput` and
   `compileCreateTransaction`.
2. Cover expense, income, same-instrument transfer, cross-instrument transfer,
   missing references, invalid amounts, and deterministic context.
3. Assert resulting state after issue/materialization.
4. Implement preview by compiling with a deterministic preview context and
   applying the command to an ephemeral snapshot only.
5. Implement stage by recompiling with the real context, issuing one command,
   appending it, and atomically persisting.
6. Return a compact before/after transaction view and the staged transaction
   id.
7. Include `balancePendingCanonicalSync: true` when money fields change.

Exit:

- preview leaves the state file unchanged;
- stage appends exactly one durable command;
- reload preserves and replays the new operation;
- `outbox` reports it without exposing an unbounded raw patch;
- transport contains the full primary transaction and no predicted effects.

Suggested commit:

```txt
feat(zerro-core): add semantic transaction creation
```

The tool wrapper may be a second commit if the Core slice is independently
reviewable.

### W5 — Update, outbox inspection, and undo

Goal: support proposed edits and recovery before sync.

Files:

- `tools/zerro/src/application/transactionUpdate.ts`
- `tools/zerro/src/application/outbox.ts`
- focused tests
- Core semantic compiler additions only when a raw editable patch would bypass
  an existing domain rule

Steps:

1. Support a bounded editable-field allowlist.
2. Preview the materialized before/after transaction.
3. Stage through `issuePatch` and the existing outbox path.
4. Format outbox entries as command position, issued time, touched entity ids,
   and a compact summary.
5. Implement undo with the existing `undoOutbox`.
6. Do not persist redo; an undone command disappears after process exit.
7. Do not add arbitrary entity patching.

Exit:

- preview does not mutate;
- stage + undo restores the same `current`;
- reload after stage retains the edit;
- reload after undo retains only the shortened outbox;
- unsupported fields fail before persistence.

Suggested commit:

```txt
feat(zerro-tool): preview stage and undo transaction edits
```

### W6 — Explicit sync

Goal: send the local outbox using the already accepted replica semantics.

Files:

- `tools/zerro/src/application/sync.ts`
- sync fixture tests
- shared refresh/sync helpers
- Redux adaptation if canonical acceptance was centralized earlier

Steps:

1. Capture the sent prefix count.
2. Build primary-only transport with a fresh `sentAt`.
3. Send transport plus the overlap cursor.
4. Leave the file unchanged on failure.
5. Apply the canonical response and drop exactly the sent prefix on success.
6. Persist the accepted base and remaining outbox atomically.
7. Warn when a staged create id is absent from the canonical response.
8. Never retry automatically.
9. Cover a command appended after the captured prefix in the pure replica test,
   even though the first CLI runtime is single-process.

Exit:

- successful sync clears only the sent prefix;
- canonical balances and server materialization appear in the next reads;
- failed sync preserves all pending intent;
- `buildOutboxTransport` remains the only transport builder;
- full replica/sync test gates pass.

Suggested commit:

```txt
feat(zerro-tool): sync the local Core outbox
```

This is the complete CLI MVP.

### W7 — Optional MCP adapter

Start only after W6 and only if agents need discovery beyond shell access.

The MCP server:

- runs over stdio;
- calls the same application functions as the CLI;
- has no separate persistence, HTTP, query, preview, or sync logic;
- exposes bounded tools corresponding to stable CLI commands;
- does not expose a generic shell or raw patch tool.

Initial tools:

- `finance_status`
- `finance_refresh`
- `accounts_list`
- `transactions_search`
- `month_get`
- `transaction_preview_create`
- `transaction_stage_create`
- `transaction_preview_update`
- `transaction_stage_update`
- `outbox_list`
- `outbox_undo`
- `finance_sync`

MCP is not required to call the CLI MVP complete.

## Verification by change type

| Change                           | Required gate                                                      |
| -------------------------------- | ------------------------------------------------------------------ |
| CLI parsing/output               | focused Node test + tool TypeScript                                |
| state-file persistence           | focused Node test including failure paths                          |
| session/query exposure           | session test + deterministic demo regression                       |
| transaction compiler             | compiler + resulting-state + materializer/outbox tests             |
| replica canonical acceptance     | focused replica + reducer integration + default full suite         |
| sync orchestration               | fixture HTTP test + replica/sync integration + default full suite  |
| Core entrypoint/package boundary | API boundary + `pnpm zerro-core:package-check`                     |
| MCP adapter                      | schema contract + application-delegation test; no duplicated logic |

Before completing each wave:

```bash
pnpm exec vitest run <focused tests> --reporter=agent --silent=passed-only
pnpm typecheck
pnpm exec eslint <touched ts files> --max-warnings 0
pnpm exec prettier --check "<touched files>"
git diff --check
```

Run the default parallel suite and package check only when the testing matrix
requires them. Do not repeatedly rerun successful broad gates while their
inputs are unchanged.

## Continuation protocol for future agents

At the start of every continuation:

1. confirm `cwd` is `/Users/ardov/GitHub/zerro`;
2. run `git status --short`;
3. read this document, [architecture.md](./architecture.md), and the relevant
   section of [testing.md](./testing.md);
4. inspect recent Git commits; Git outranks the status text below;
5. find the first wave whose exit gate is not satisfied;
6. implement only that wave or one independently testable slice inside it;
7. update this document's status table in the same commit;
8. record any changed boundary in [design-ledger.md](./design-ledger.md);
9. preserve unrelated working-tree changes;
10. never begin W7 before the CLI MVP through W6 is complete.

Do not:

- recreate `createZerroEngine` beside the pure outbox operations;
- copy Redux reducer logic into the CLI;
- import `zerro-core/internal/*` from `tools/zerro`;
- persist `current`, redo, previews, derived reports, or the token;
- derive sync transport from `current`;
- combine preview, stage, and sync behind one agent call;
- convert a temporary CLI DTO into a new Core domain type without a second
  consumer.

## Status table

Update one row at a time. Use `pending`, `active`, `blocked`, or `complete`.

| Wave | Status   | Last verified evidence                                   |
| ---- | -------- | -------------------------------------------------------- |
| W-1  | complete | 97 files / 385 tests; types, ESLint, Knip, package check |
| W0   | pending  | plan accepted                                            |
| W1   | pending  | —                                                        |
| W2   | pending  | —                                                        |
| W3   | pending  | —                                                        |
| W4   | pending  | —                                                        |
| W5   | pending  | —                                                        |
| W6   | pending  | —                                                        |
| W7   | pending  | optional                                                 |

## MVP completion

The CLI MVP is complete when a fresh local checkout can:

1. receive a token only through `ZERRO_TOKEN`;
2. bootstrap a snapshot with `refresh`;
3. answer account, transaction, and month questions through bounded JSON;
4. preview an expense without modifying the state file;
5. stage it and observe it in `current` and the outbox after reload;
6. undo it before sync;
7. stage it again and explicitly sync;
8. observe the canonical transaction and account balance after sync;
9. preserve all staged intent after a failed sync;
10. pass W0–W6 gates with no Core internal imports from the tool.

Anything beyond this list is follow-up work, not required MVP polish.
