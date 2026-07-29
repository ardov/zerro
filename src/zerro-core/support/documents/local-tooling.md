# Local finance tooling MVP

- Status: implementation active; W0–W3 complete
- Updated: 2026-07-29
- Scope: a local CLI first, with an optional MCP adapter after the CLI contract
  is stable

## Goal

Build a small local tool that lets an agent:

1. refresh and inspect the user's normalized ZenMoney snapshot;
2. discover accounts, tags, merchants, and envelopes by stable id;
3. search a bounded transaction history;
4. read monthly totals, envelope budgets and metrics, goals, balances, and
   debtors through Zerro Core projections;
5. preview and stage a bounded monthly envelope-budget update;
6. preview and stage a semantic transaction creation;
7. inspect and undo staged changes;
8. explicitly synchronize the staged outbox with ZenMoney.

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
- semantic budget and transaction inputs rather than a public generic patch
  tool;
- separate preview and stage commands with explicit side-effect metadata;
- an explicit sync action;
- bounded JSON output with stable versioned envelopes;
- machine-readable discovery for commands and referenced entities;
- caller-provided request ids for retry-safe outbox mutations;
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
- do not persist proposals: preview is a pure response, and stage reruns the
  same semantic request against the latest local state;
- persist only a bounded cache of recent local-mutation receipts for
  idempotency; it is not a proposal store or audit log;
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
- account, tag, merchant, reminder, or envelope creation;
- envelope rename, settings, or structure mutation;
- transaction update or deletion in the MVP;
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
  recentRequests: TRecentRequestReceipt[]
}

type TRecentRequestReceipt = {
  requestId: string
  command: string
  inputHash: string
  completedAt: number
  receipt: Record<string, string | number | boolean | null>
}
```

Rules:

- `current = replayOutbox(base, outbox)` after every load;
- never persist `current`, `redo`, token, derived projections, sync status, or
  preview data;
- retain at most the 32 most recent local-mutation receipts; reuse of the same
  request id, command, and normalized input returns its previous receipt, while
  any other reuse fails with `IDEMPOTENCY_CONFLICT`;
- require request ids to be 1–128 characters from `[A-Za-z0-9._:-]`;
- compute `inputHash` from canonical key-sorted JSON after runtime parsing;
- compute `stateRevision` from endpoint, base, and outbox only; the
  recent-request cache does not change the semantic revision;
- use `ZERRO_STATE_PATH` when set;
- otherwise use
  `join(homedir(), '.zerro', 'state-v1.json')` without shell expansion;
- resolve the endpoint from `ZERRO_ENDPOINT`, defaulting to `ru`, on an absent
  state; persist it on the first successful write and reject a conflicting
  override for an existing state;
- create the parent directory with mode `0700` on first write;
- create state and temporary files with mode `0600`;
- write a complete temporary sibling file and rename it over the target;
- reject an unknown state version or malformed Core outbox;
- validate that `base` has a finite timestamp and an object map for every
  normalized entity family; deep entity-field validation is outside MVP because
  the tool is the only writer;
- an absent file means the resolved endpoint plus an empty base, outbox, and
  recent-request cache, not a partially initialized state;
- `refresh` with cursor `0` bootstraps the first full snapshot;
- no command may write the state file if its operation fails.

The first implementation may state that concurrent writers are unsupported.
Atomic rename still protects against a truncated file after a crash.

## Mutation model

Every command declares one of three side-effect classes:

```txt
none       reads and previews; no local or remote mutation
local      refresh, stage, or undo; atomically changes only local state
remote     sync; sends the current outbox prefix to ZenMoney
```

There is no proposal id or proposal store.

Preview and stage accept the same semantic input. Stage recompiles against the
latest `current`; it must not accept a materialized patch copied from a previous
preview. Generated ids and timestamps are created only during stage. A preview
may return `generatedId: null` because it is not replay state.

Outbox mutations (`stage` and `undo`) require a caller-provided `requestId`. The
tool hashes the normalized semantic request and stores a bounded receipt in the
same atomic write as the outbox change. This protects an agent retry after lost
stdout without introducing durable proposals. `refresh` is naturally repeatable
and does not use this receipt cache.

The CLI uses separate preview and stage commands and must not combine stage and
sync. This keeps every side effect visible and maps directly to a future MCP
tool:

```bash
pnpm zerro -- transaction preview-create --input expense.json
pnpm zerro -- transaction stage-create --request-id <id> --input expense.json
pnpm zerro -- outbox list
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
  effect: 'none' | 'local' | 'remote'
  meta: {
    observedAt: string
    baseServerTimestampMs: number
    stateRevision: string
    pendingCommandCount: number
    balancePendingCanonicalSync: boolean
  }
  data: T
  warnings?: TWarning[]
}

type TWarning = {
  code: string
  message: string
  entityIds?: Array<string | number>
}
```

Every expected failure returns:

```ts
type TFailure = {
  schemaVersion: 1
  ok: false
  command: string
  effect: 'none' | 'local' | 'remote'
  error: {
    code: string
    message: string
    outcome: 'not_applied' | 'unknown'
    retryable: boolean
    details?: TBoundedErrorDetails
  }
}

type TBoundedErrorDetails = Record<
  string,
  string | number | boolean | null | Array<string | number>
>
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
- error details contain only bounded JSON-safe scalars and short arrays;
- network failures distinguish a definitive local failure from an unknown
  remote outcome; an agent must not retry `sync` blindly after `unknown`;
- default list limit is `50`; maximum is `200`;
- list responses return `{ returned, nextCursor }`; cursors are opaque, bind to
  the normalized query and `stateRevision`, and become invalid when the
  revision changes;
- paged entities use a total order with stable id as the final tie-breaker;
- money values remain numbers in their original instrument and include the
  instrument id, code, and symbol when available;
- human-facing timestamps in output use ISO strings; numeric cursor timestamps
  use an explicit `Ms` or `Seconds` suffix;
- include stable ids even when a human title is present.

## Planned CLI surface

### Discovery, state, and refresh

```bash
pnpm zerro -- help
pnpm zerro -- status
pnpm zerro -- refresh
```

`help` is local-only and returns a machine-readable bounded command manifest:

- stable command name;
- side-effect class: `none`, `local`, or `remote`;
- required and optional inputs;
- one compact example;
- the success data shape name and expected error codes.

It is not a second generated schema system. The application DTOs and focused
contract tests remain authoritative.

`status` is local-only and returns:

- whether a state file exists;
- endpoint;
- state path and semantic state revision;
- base timestamp in milliseconds;
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
pnpm zerro -- accounts list
pnpm zerro -- tags search --query food
pnpm zerro -- merchants search --query amazon
pnpm zerro -- transactions search --from 2026-07-01 --to 2026-07-31
pnpm zerro -- transactions search --query taxi --account <id> --limit 50
pnpm zerro -- month get 2026-07
pnpm zerro -- envelopes list --month 2026-07
pnpm zerro -- envelopes get <id> --month 2026-07
pnpm zerro -- goals list --month 2026-07
pnpm zerro -- debtors list --limit 50
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
- provide bounded account, tag, merchant, and envelope discovery before any
  mutation accepts their ids;
- page rows after filtering and a total Core ordering with stable id as the
  final tie-breaker;
- omit raw normalized collections that the command did not request.

Minimum account row:

```ts
type TAccountRow = {
  id: string
  title: string
  type: string
  archive: boolean
  inBalance: boolean
  canonicalBalance: number
  balancePendingCanonicalSync: boolean
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

Minimum envelope row:

```ts
type TEnvelopeRow = {
  id: TEnvelopeId
  name: string
  type: 'tag' | 'account' | 'merchant' | 'payee'
  group: string
  parentId: TEnvelopeId | null
  childIds: TEnvelopeId[]
  currency: string
  self: TEnvelopeMetricRow
  withChildren: TEnvelopeMetricRow
}

type TEnvelopeMetricRow = {
  budgetByCurrency: Record<string, number>
  activityByCurrency: Record<string, number>
  availableByCurrency: Record<string, number>
  transactionCount: number
}
```

`envelopes list/get` format `session.envelopes.getAll()`,
`session.envelopes.getStructure()`, `session.budgets.getAll()`, and
`session.envelopes.getMetrics()` for the requested month. They do not expose raw
hidden reminders or reimplement envelope calculations.

`month get` returns the existing Core month total plus a compact budget and
envelope summary. It must not invent a second accounting calculation.

### Preview and stage

```bash
pnpm zerro -- budget preview-set --input <path-or-stdin>
pnpm zerro -- budget stage-set --request-id <id> --input <path-or-stdin>
pnpm zerro -- transaction preview-create --input <path-or-stdin>
pnpm zerro -- transaction stage-create --request-id <id> --input <path-or-stdin>
pnpm zerro -- outbox list
pnpm zerro -- outbox undo --request-id <id>
```

The first write slice supports:

- set or explicitly clear up to 50 envelope budgets for one month as one
  command;
- create expense;
- create income;
- create same- or cross-instrument transfer;
- transaction update and delete remain follow-up work.

The first write slice accepts only stable ids. An agent resolves natural-language
references through the bounded account, tag, merchant, and envelope reads before
constructing a mutation. Automatic title matching is deliberately deferred so
the tool never silently chooses one of several entities.

`--input <path>` reads one JSON object from a file. `--input -` reads one JSON
object from stdin. Inline JSON CLI arguments are deliberately unsupported so
shell quoting cannot become a second input format.

Every input file is parsed from `unknown` by an application-owned exact-key
runtime parser before it reaches Core. Unknown fields and values outside the
documented JSON DTO fail as invalid input.

## Semantic envelope-budget update

The agent input is deliberately narrower than Core's internal
`TBudgetUpdate`:

```ts
type TSetEnvelopeBudgetsRequest = {
  month: TISOMonth
  updates: Array<
    | {
        envelopeId: TEnvelopeId
        operation: 'set'
        amount: number
        currency: string
      }
    | {
        envelopeId: TEnvelopeId
        operation: 'clear'
      }
  >
}
```

Application rules:

- require a valid `YYYY-MM` month;
- require between 1 and 50 updates;
- require unique envelope ids;
- resolve every id through the current envelope projection;
- require a finite positive amount for `set`;
- require the supplied currency to equal the envelope currency;
- reject `amount` and `currency` on `clear`;
- translate `clear` to Core's internal zero-value removal only after validation;
- call the existing `compileSetBudget` once with the whole batch, preserving its
  routing between ZenMoney tag budgets and hidden envelope budgets;
- preview the affected envelope rows against an ephemeral snapshot;
- stage the whole batch as exactly one durable Core command;
- return bounded before/after rows and never expose hidden reminder payloads.

The application must not reproduce `compileSetBudget` routing or decide which
storage entity family receives a budget.

## Semantic transaction creation

The existing Core compiler remains authoritative. The agent JSON DTO is narrower
than its internal `TDateDraft` input and accepts only an ISO calendar date:

```ts
type TCreateTransactionRequest =
  | {
      kind: 'expense'
      accountId: TAccountId
      amount: number
      date: TISODate
      tagIds?: TTagId[]
      merchantId?: TMerchantId | null
      payee?: string | null
      comment?: string | null
    }
  | {
      kind: 'income'
      accountId: TAccountId
      amount: number
      date: TISODate
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
      date: TISODate
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

## Headless Core source entrypoint

`src/zerro-core/headless.ts` is the explicit non-Redux source boundary. Keep it
explicit; do not export internal barrels.

The W-1 surface already exposes snapshot reads, transaction creation, query,
replica, cursor, and transport capabilities. W0 may extend the explicit surface
only with:

```ts
export { compileSetBudget, parseCommandOutbox, stageCompiledCommand }
```

W0 removes `parsePersistedReplica` from `zerro-core/headless`; it remains the
browser-runtime persistence parser behind the replica integration seam and is
not the validation API for the tool's different state version. The tool owns
`parseLocalToolState`; Core owns validation of its durable command array.

`stageCompiledCommand` is a pure invariant-preserving operation. Given
`base + outbox`, a `TCompiled<TReceipt>`, and `issuedAt`, it:

1. replays current;
2. issues the compiled intent against that current;
3. rejects an empty materialized result;
4. appends exactly one command;
5. returns `{ base, current, outbox, command, receipt }`.

This prevents the tool from reassembling issue/append/materialize invariants.
It owns no persistence and is not a stateful engine object.

Update `api-boundary.test.ts` so `zerro-core/headless` is an allowed explicit
entrypoint and so no tool imports `zerro-core/internal/*`.

## Sync algorithm

`sync` is explicit and single-process:

1. load and validate local state;
2. return a successful local no-op without network access when the outbox is
   empty;
3. fail before network access when `ZERRO_TOKEN` is missing;
4. capture `sentOutboxCount = outbox.length`;
5. compute `sentAt`;
6. build primary-only transport from `base` and the captured outbox;
7. add the same overlap cursor used by `refresh`;
8. convert to the ZenMoney wire shape and call `/v8/diff/`;
9. parse and validate the response from `unknown` before conversion or
   persistence;
10. on a pre-request failure or explicit server rejection that proves no remote
    write was accepted:
    - leave the state file byte-for-byte unchanged;
    - return `outcome: 'not_applied'`;
11. on a transport, response parsing, or response validation failure after the
    request may have reached ZenMoney:
    - leave the state file byte-for-byte unchanged;
    - return `outcome: 'unknown'` and `retryable: false`;
    - instruct the caller through the error code to refresh and inspect before
      deciding on another sync;

12. on success:

- apply the canonical patch to `base`;
- remove exactly the captured prefix;
- replay any remaining commands;
- atomically persist the result;

13. return changed-domain counts and the remaining outbox count.

The MVP intentionally accepts the app's whole-prefix acknowledgement risk. Do
not invent command ids, per-field acknowledgements, quarantine, or retries.

After a successful create sync, the command response should confirm whether the
created transaction id appeared in the canonical response. If it did not, emit
a warning; do not add a second automatic request in the first implementation.

`refresh` and `sync` must share cursor, HTTP, conversion, canonical-acceptance,
runtime response parsing, and persistence helpers. The HTTP adapter accepts
injected `fetch` and `now` dependencies for deterministic tests. `refresh` and
`sync` must not be two orchestration implementations.

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

### W0 — Agent CLI and atomic local replica — complete

Goal: establish the Node-only agent contract and persist `base + outbox`
without network access.

Files:

- `tools/zerro/tsconfig.json`
- `tools/zerro/src/cli.ts`
- `tools/zerro/src/application/output.ts`
- `tools/zerro/src/application/context.ts`
- `tools/zerro/src/application/workspace.ts`
- `tools/zerro/src/application/status.ts`
- `tools/zerro/src/adapters/stateFile.ts`
- focused Node tests
- `src/zerro-core/headless.ts`
- the narrow Core outbox-validation and stage helpers
- `package.json`
- `knip.json`

Steps:

1. Add `"zerro": "tsx tools/zerro/src/cli.ts"` and `tsx` as the sole execution
   dependency if it is not already available. Do not add a CLI framework; use
   `node:util.parseArgs`.
2. Add a tool typecheck and include it in `pnpm typecheck`; add the entrypoint
   to Knip and the touched-file lint/format paths.
3. Implement machine-readable `help` and local `status`.
4. Freeze success, failure, warning, pagination, and side-effect metadata with
   contract tests.
5. Add `parseCommandOutbox` and pure `stageCompiledCommand`; expose
   `compileSetBudget` through the explicit headless boundary.
6. Implement exact local-state parsing, absent-file bootstrap, endpoint
   selection, semantic revision hashing, and replay on load.
7. Implement atomic save with `0700` directory and `0600` file permissions.
8. Persist and evict the bounded recent-request receipt cache in the same atomic
   write as local mutations.
9. Test malformed JSON, unknown version, invalid outbox, endpoint mismatch,
   duplicate request ids, missing parent directory, permissions, and write
   failure.
10. Put `// @vitest-environment node` on Node adapter tests and prove no browser
    global or Core internal path is imported.

Exit:

- `help` describes every current command and side effect in valid bounded JSON;
- `status` works with an absent or existing state;
- a persisted outbox replays identically after reload;
- redo/current are absent from the file;
- an interrupted or failed write does not replace the previous valid state;
- retrying an accepted local request id returns its prior receipt without a
  second command;
- TypeScript, focused tests, API boundary, package boundary, and Knip pass.

Suggested commit:

```txt
feat(zerro-tool): establish the agent CLI and local replica
```

Implemented in the current working slice:

- machine-readable `help` and local `status`;
- exact local state parsing, absent-state bootstrap, endpoint pinning, semantic
  revision hashing, replay, and atomic private-file persistence;
- bounded recent-request receipt helpers with conflict detection and eviction;
- explicit `parseCommandOutbox`, `stageCompiledCommand`, and
  `compileSetBudget` headless exports;
- Node-only adapter and read contract coverage;
- CLI typecheck, ESLint, Knip, and package-boundary integration.

### W1 — Refresh and bounded finance reads — complete

Goal: bootstrap one snapshot and answer the first useful agent questions.

Files:

- `tools/zerro/src/adapters/zenmoney.ts`
- `tools/zerro/src/application/refresh.ts`
- `tools/zerro/src/application/accounts.ts`
- `tools/zerro/src/application/entitySearch.ts`
- `tools/zerro/src/application/transactions.ts`
- `tools/zerro/src/application/month.ts`
- `tools/zerro/src/application/envelopes.ts`
- `tools/zerro/src/application/goals.ts`
- `tools/zerro/src/application/debtors.ts`
- `tools/zerro/src/application/present.ts`
- corresponding focused tests
- Core total-order adjustment if the existing transaction order lacks an id
  tie-breaker

Steps:

1. Inject `fetch`, `now`, and token lookup in tests; never use a real token in
   the default suite.
2. Reuse the existing endpoint table and diff converter, remove converter
   stdout logging, and parse the wire response from `unknown`.
3. Reuse Core `getSyncCursor` and `acceptCanonicalPatch`; send no transport
   entities from `refresh`.
4. Cover full bootstrap, incremental overlap, remote deletion, pending-outbox
   rebase, malformed response, network failure, and missing token.
5. Implement bounded account, tag, and merchant discovery with stable ids.
6. Implement transaction search through `session.transactions.query`, then
   paginate after a total order with stable id as the final tie-breaker.
7. Implement month, goal, and debtor output as thin session formatting.
8. Implement envelope list/get from the existing envelope structure, budgets,
   and monthly metrics; include self and with-children values.
9. Bind every cursor to normalized query plus semantic state revision.
10. Verify reads use `current`, surface pending state, and remain bounded on a
    representative large fixture.

Completed:

- explicit token-gated refresh with injected `fetch`/clock, shallow bounded
  wire validation, full bootstrap, overlap cursor, canonical acceptance, and
  atomic save only after success;
- removal of converter timing logs from stdout;
- bounded account listing plus tag and merchant discovery;
- transaction search through `session.transactions.query`;
- opaque pagination bound to normalized query and semantic state revision;
- month totals plus compact envelope and goal summaries;
- bounded envelope list/get with hierarchy and self/with-children metrics;
- bounded goal and debtor reads without raw hidden reminders or debtor
  transaction arrays;
- explicit `STATE_NOT_INITIALIZED` instead of non-finite projection values
  before the first refresh;
- focused coverage for complete bootstrap, second refresh, missing token,
  malformed and network responses, canonical id-less wire budgets, remote
  deletion, pending-outbox rebase, replayed `current`, cursor mismatch, and a
  representative large fixture.

Exit evidence:

- full Vitest suite passes: 102 files and 405 tests;
- `pnpm typecheck`, `pnpm lint:js`, and `pnpm knip` pass;
- `pnpm zerro-core:package-check` and `git diff --check` pass;
- CLI smoke confirms bounded JSON and explicit uninitialized-state failure;
- a guarded read-only live smoke against ZenMoney passes a full refresh, an
  overlap refresh, and every W1 read command; the token is absent from the
  persisted state, whose directory/file modes are `0700`/`0600`.

Exit:

- a fresh state becomes a valid full fixture snapshot;
- a second refresh uses the overlap cursor;
- a failed refresh leaves the state file unchanged;
- another agent can discover entity ids, find a transaction, inspect envelope
  hierarchy and budgets, and summarize one month using only `help` and JSON;
- pending commands survive refresh and are visible in reads;
- no query exceeds the configured maximum;
- output matches `createZerroSession` and Core query results.

Suggested commit:

```txt
feat(zerro-tool): refresh and expose bounded finance reads
```

This is the first useful read-only MVP checkpoint.

### W2 — Envelope budgets, outbox inspection, and undo — complete

Goal: preview, stage, inspect, and recover one atomic monthly budget batch.

Files:

- `tools/zerro/src/application/budgetSet.ts`
- `tools/zerro/src/application/outbox.ts`
- focused application, parser, idempotency, and routing tests
- `src/zerro-core/headless.ts`

Steps:

1. Parse the exact `TSetEnvelopeBudgetsRequest` JSON DTO.
2. Validate month, batch bound, unique ids, envelope existence, amount, and
   currency against the latest `current` session.
3. Translate explicit `clear` only at the application-to-Core boundary.
4. Call `compileSetBudget` once for the whole batch.
5. Preview by materializing the compiled result against an ephemeral snapshot
   and formatting bounded affected-envelope before/after rows.
6. Stage through `stageCompiledCommand`, append exactly one command, record the
   request receipt, and atomically persist.
7. Cover both `preferZmBudgets` routes, `tag#null`, mixed tag/non-tag batches,
   clear, invalid references, and currency mismatch.
8. Format outbox entries as position, issued time, touched entity ids, and a
   compact semantic summary without raw patches.
9. Implement retry-safe last-command undo; do not persist redo.

Completed:

- exact JSON-only `set`/`clear` parser with a 50-update cap, no unknown keys,
  strict months, positive finite set amounts, and unique envelope ids;
- validation against the current immutable Core session, including projected
  month, discovered envelope id, and envelope currency;
- preview through the same Core compiler/materializer without state-file
  persistence, returning only bounded affected-envelope budget metrics;
- stage through `stageCompiledCommand`, one command per batch, then atomically
  persist only `base + outbox` and a flat idempotency receipt;
- compact paged outbox inspection without raw command patches;
- retry-safe last-command undo that persists no redo tail;
- routing regressions for default hidden budgets, preferred ZenMoney tag
  budgets, `tag#null`, a mixed tag/account batch, and explicit clear.

Exit evidence:

- focused W2 tests cover exact parsing, no-write preview, stage/retry/reload,
  compact outbox output, undo/retry, routing, clear, and currency rejection;
- full Vitest, typecheck, ESLint, Knip, package-boundary, and diff checks pass.

Exit:

- preview leaves the state file byte-for-byte unchanged;
- stage persists exactly one command for the whole batch;
- retrying the same request id cannot duplicate the budget change;
- envelope reads show staged budgets from `current`;
- stage plus undo restores the same semantic state after reload;
- outbox output stays bounded and reveals no hidden reminder payload.

Suggested commit:

```txt
feat(zerro-tool): preview and stage envelope budgets
```

This is the first useful write-capable MVP checkpoint.

### W3 — Semantic transaction creation — complete

Goal: preview and stage a new expense, income, or transfer.

Files:

- `tools/zerro/src/application/transactionCreate.ts`
- focused application and JSON parser tests
- CLI parser tests

Steps:

1. Parse the narrower JSON DTO with a strict `YYYY-MM-DD` date and exact keys.
2. Delegate to the existing `compileCreateTransaction`; do not modify its
   factory defaults in the tool.
3. Cover expense, income, same-instrument transfer, cross-instrument transfer,
   missing references, invalid amounts, and deterministic context.
4. Preview against an ephemeral snapshot without persisting a generated id.
5. Stage through `stageCompiledCommand`, record the idempotency receipt, and
   atomically persist.
6. Return a compact before/after transaction view and transaction id.
7. Include `balancePendingCanonicalSync: true`.

Completed:

- exact JSON-only expense, income, and transfer DTO parser with strict calendar
  dates, positive finite amounts, bounded unique tag ids, and no unknown keys;
- direct delegation to `compileCreateTransaction` for factory defaults,
  reference validation, same-account rejection, and same/cross-instrument
  transfer rules;
- preview through the same Core compiler/materializer without state-file
  persistence, returning only a compact created-transaction representation;
- stage through `stageCompiledCommand`, atomically persisting one durable
  command and a flat idempotency receipt with the generated transaction id;
- transaction-aware compact outbox summary without raw patches;
- focused coverage for expense, replay/idempotency, transport, same- and
  cross-instrument transfers, strict parsing, missing references, and no-write
  failure paths.

Exit evidence:

- full Vitest, typecheck, ESLint, Knip, package-boundary, Prettier, and diff
  checks pass.

Exit:

- preview does not mutate;
- stage appends exactly one durable command;
- a retry cannot create a second transaction;
- reload preserves and replays the new transaction;
- outbox reports it without exposing a raw patch;
- transport contains the full primary transaction and no predicted effects.

Suggested commit:

```txt
feat(zerro-tool): preview and stage transaction creation
```

### W4 — Explicit sync

Goal: send the local outbox using the already accepted replica semantics.

Files:

- `tools/zerro/src/application/sync.ts`
- sync fixture tests
- shared refresh/sync HTTP, parsing, conversion, and persistence helpers

Steps:

1. Return a no-network success when the outbox is empty.
2. Capture the sent prefix count and build primary-only transport with a fresh
   `sentAt`.
3. Send transport plus the overlap cursor.
4. Classify failures as definitive `not_applied` or ambiguous `unknown`; never
   retry automatically.
5. Leave the state file unchanged on every failure.
6. On success, apply the validated canonical response, drop exactly the sent
   prefix, and atomically persist the accepted base plus remaining outbox.
7. Warn when a staged create id is absent from the canonical response.
8. Cover a command appended after the captured prefix in the pure replica test,
   even though concurrent CLI writers remain unsupported.

Exit:

- successful sync clears only the sent prefix;
- canonical budgets, balances, and transaction materialization appear in reads;
- definitive and ambiguous failures preserve all pending intent;
- an ambiguous outcome cannot be reported as safe to retry;
- `buildOutboxTransport` remains the only transport builder;
- full replica/sync test gates pass.

Suggested commit:

```txt
feat(zerro-tool): sync the local Core outbox
```

This is the complete CLI MVP.

### W5 — Optional MCP adapter

Start only after W4 and only if agents need discovery beyond shell access.

The MCP server:

- runs over stdio;
- calls the same application functions as the CLI;
- has no separate persistence, HTTP, query, preview, or sync logic;
- exposes bounded tools corresponding one-to-one with stable CLI commands;
- preserves the same side-effect and error metadata;
- does not expose a generic shell or raw patch tool.

Initial tools:

- `finance_status`
- `finance_refresh`
- `accounts_list`
- `tags_search`
- `merchants_search`
- `transactions_search`
- `month_get`
- `envelopes_list`
- `envelopes_get`
- `goals_list`
- `debtors_list`
- `budget_preview_set`
- `budget_stage_set`
- `transaction_preview_create`
- `transaction_stage_create`
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
| envelope/budget formatting       | session projection + bounded DTO regression                        |
| budget compiler or routing       | compiler + both storage routes + resulting-state test              |
| local mutation idempotency       | focused retry/conflict + atomic persistence test                   |
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
10. never begin W5 before the CLI MVP through W4 is complete.

Do not:

- recreate `createZerroEngine` beside the pure outbox operations;
- copy Redux reducer logic into the CLI;
- import `zerro-core/internal/*` from `tools/zerro`;
- persist `current`, redo, previews, derived reports, or the token;
- turn the bounded recent-request cache into proposals, history, or an audit
  database;
- derive sync transport from `current`;
- combine preview, stage, and sync behind one agent call;
- accept raw Core `TDateDraft` or internal zero-means-clear budget semantics as
  agent JSON;
- convert a temporary CLI DTO into a new Core domain type without a second
  consumer.

## Status table

Update one row at a time. Use `pending`, `active`, `blocked`, or `complete`.

| Wave | Status   | Last verified evidence                                     |
| ---- | -------- | ---------------------------------------------------------- |
| W-1  | complete | 97 files / 385 tests; types, ESLint, Knip, package check   |
| W0   | complete | focused Node tests; types, ESLint, Knip, package check     |
| W1   | complete | 102 files / 405 tests; live read-only smoke passes         |
| W2   | complete | 103 files / 411 tests; local budget/outbox/undo gates pass |
| W3   | complete | 104 files / 416 tests; local transaction-create gates pass |
| W4   | pending  | —                                                          |
| W5   | pending  | optional                                                   |

## MVP completion

The CLI MVP is complete when a fresh local checkout can:

1. receive a token only through `ZERRO_TOKEN`;
2. discover every command and its side-effect class through JSON `help`;
3. bootstrap a snapshot with `refresh`;
4. discover account, tag, merchant, and envelope ids through bounded JSON;
5. inspect envelope hierarchy, monthly budgets, activity, and availability;
6. preview a multi-envelope budget update without modifying the state file;
7. stage it as one command, observe it after reload, and safely retry the same
   request id;
8. undo the staged budget update;
9. preview and stage an expense with the same safety properties;
10. explicitly sync and observe canonical budgets, transaction, and account
    balance;
11. preserve all staged intent and report a non-retryable ambiguous outcome
    after an uncertain sync failure;
12. pass W0–W4 gates with no Core internal imports from the tool.

Anything beyond this list is follow-up work, not required MVP polish.
