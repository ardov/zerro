# Local finance tooling MVP

- Status: complete and shipped; this document is the tool's contract
- Updated: 2026-07-30
- Scope: one repository-local CLI. A second transport would come from the
  desktop-host question, not from this document.
- Usage documentation is
  [tools/zerro/README.md](../../../../tools/zerro/README.md); the `help`
  command is the machine-readable surface.

## Goal

A small local tool that lets an agent refresh and inspect the user's normalized
ZenMoney snapshot, discover entities by stable id, search a bounded transaction
history, read monthly totals and envelope metrics through Core projections,
preview and stage envelope-budget updates and transactions, undo staged
changes, and explicitly synchronize. All of it shipped.

The tool is a source consumer inside this repository. It does **not** publish
or physically move `zerro-core`; proving the headless boundary was the point.

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

The decisions themselves — one CLI with bounded JSON, separate
preview/stage/sync, unpersisted previews, caller-provided request ids, one
profile and endpoint, `base + outbox` as the only persisted truth, atomic
writes, single-writer scope, and deferred retry machinery — are recorded in
[design-ledger.md](./design-ledger.md#local-tooling). Three operational rules
have no other home:

- the token is read from explicit `ZM_TOKEN`, or as a convenience from the same
  name in the ignored repository-local `.env.local`; the explicit environment
  variable wins, and the file is parsed rather than sourced;
- the token never appears in stdout, persisted state, or error objects — not
  even truncated;
- balance prediction stays deferred, so a transaction preview must say that
  canonical balances may change after sync.

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
- any network-reachable transport of its own: MCP server, HTTP server, or
  daemon. A desktop host may later expose one around these application
  functions; this tool does not grow one;
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
tokens, paths, and persistence.

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
sync. This keeps every side effect visible and individually reversible:

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
    rates: { base: string; values: Record<string, number> }
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
- exit `2`: invalid input, nothing attempted — `INVALID_INPUT`,
  `INVALID_COMMAND`, `INVALID_CURSOR`, `INVALID_REQUEST_ID`,
  `INVALID_ENDPOINT`, `INPUT_READ_FAILED`, `CURRENCY_MISMATCH`;
- exit `3`: valid input with no match and nothing to do — `ENTITY_NOT_FOUND`,
  `MONTH_NOT_FOUND`, `NO_CHANGES`, `OUTBOX_EMPTY`;
- exit `4`: missing prerequisite — `STATE_NOT_INITIALIZED`, `TOKEN_REQUIRED`;
- exit `5`: local failure with no applied change — `INTERNAL_ERROR`,
  `IDEMPOTENCY_CONFLICT`, `INVALID_RECEIPT`, `OUTBOX_NO_TRANSPORT`,
  `INVALID_STATE`, `STATE_READ_FAILED`, `STATE_WRITE_FAILED`,
  `ENDPOINT_MISMATCH`;
- exit `6`: ZenMoney transport or response failure — `NETWORK_FAILURE`,
  `ZENMONEY_REJECTED`, `INVALID_ZENMONEY_RESPONSE`;
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

## CLI surface

This is the shipped surface. `pnpm -s zerro help` is the authoritative machine
listing; this section is the contract each command has to keep.

### Shared output options

Reads accept a common set of options, so an agent learns them once:

- `--limit` (default 50, maximum 200) and `--cursor` for paging;
- `--fields` to project the response down to comma-separated dot-paths;
- `--format json|tsv`, where `tsv` flattens `data.items` one level and
  JSON-stringifies anything deeper into its cell;
- `--display-currency <code>` to add a converted single number beside the
  by-currency vector, using the rates reported in `meta.rates`;
- `--query` for a case-insensitive substring filter on title or name.

An option that exists on one read must keep the same name and meaning on every
other read. A projection path that matches nothing warns instead of failing.

### Discovery, state, and refresh

```bash
pnpm zerro -- help
pnpm zerro -- help --shape reportPage
pnpm zerro -- version
pnpm zerro -- status
pnpm zerro -- refresh
```

`help` is local-only and returns a machine-readable bounded command manifest:

- stable command name;
- side-effect class: `none`, `local`, or `remote`;
- required and optional inputs, each with a type and one-line description;
- one compact example;
- the success data shape name and expected error codes;
- a short prose guide covering output shaping, multi-currency amounts, and
  warnings.

`help --shape <name>` documents the fields of one success shape, so an agent
never has to read tool source to learn a response. `version` reports the
package version the CLI was built from.

Help is not a second generated schema system. The application DTOs and focused
contract tests remain authoritative.

`status` is local-only. It answers where the state lives, how current it is,
and how much is staged, plus token availability as a boolean.

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
pnpm zerro -- transactions search --query taxi --account <id> --type outcome
pnpm zerro -- month get 2026-07
pnpm zerro -- months list --from 2026-01 --to 2026-07
pnpm zerro -- envelopes list --month 2026-07 --roots-only
pnpm zerro -- envelopes get <id> --month 2026-07
pnpm zerro -- goals list --month 2026-07
pnpm zerro -- debtors list --limit 50
pnpm zerro -- report activity --group-by tag --from 2026-07-01 --to 2026-07-31
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

Response shapes are not specified here. Every command names a `successShape`,
and `help --shape <name>` documents each of its fields; `shapes.ts` and its
contract tests are the source of truth, so a row can gain a field without a
documentation edit. The durable rules are that a row always carries stable ids
alongside any human label, that money keeps its original instrument with the
instrument id, code, and symbol, and that a converted number only ever appears
beside the per-currency value, never instead of it.

`envelopes list/get` format `session.envelopes.getAll()`,
`session.envelopes.getStructure()`, `session.budgets.getAll()`, and
`session.envelopes.getMetrics()` for the requested month. They do not expose raw
hidden reminders or reimplement envelope calculations.

`month get` returns the existing Core month total plus a compact budget and
envelope summary. It must not invent a second accounting calculation.
`months list` pages the same summary over a month range so a trend needs one
call instead of twelve.

`report activity --group-by tag|merchant|account|month` aggregates the same
routed activity projection that the app uses. Its default `net` direction nets
refunds against spending per the envelope's `keepIncome` flag and excludes
general income; `outcome` and `income` report one gross side. The report never
recomputes routing locally and never returns transaction arrays.

Entity options accept a stable id or an exact title, case-insensitively. A miss
raises `ENTITY_NOT_FOUND` and lists up to five substring candidates. Reads never
pick one of several substring matches on the caller's behalf; writes stay
id-only.

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

It exposes snapshot reads, transaction creation, query, replica, cursor, and
transport capabilities, plus `compileSetBudget`, `parseCommandOutbox`, and
`stageCompiledCommand`. Add a member only for a real consumer.

`parsePersistedReplica` deliberately stays out: it is the browser-runtime
persistence parser behind the replica integration seam, not a validation API
for the tool's different state version. The tool owns `parseLocalToolState`;
Core owns validation of its durable command array.

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
3. fail before network access when `ZM_TOKEN` is missing;
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

## History

W-1 through W4 built this tool between 2026-07-20 and 2026-07-29: headless Core
readiness, the CLI and atomic local replica, refresh and bounded reads,
envelope budgets with outbox undo, semantic transaction creation, and explicit
sync. Each wave landed as its own commit with its own gates; `git log
tools/zerro src/zerro-core/headless.ts` is the record, and it outranks any
retrospective summary here.

Current evidence: 111 test files / 495 tests green in the default parallel
suite, plus types, ESLint, Knip, and the package check (2026-07-30).

## Shipped after the MVP

These landed on top of W4 without a new wave, because each one only widened an
existing read or its presentation:

- currency-aware reads: `--display-currency` plus `meta.rates`;
- name lookups for `--account`, `--tag`, and `--merchant`;
- output shaping: `--fields` projection and `--format tsv`;
- `months list` and `report activity` with a net-aware direction;
- transaction `--type` filtering and page totals;
- CLI ergonomics: typed option specs in `help`, `help --shape`, the prose
  guide, `version`, and response `warnings`.

Record a change here when it changes the agent-visible surface without changing
a contract above. A change that alters persistence, command shape, sync, or the
side-effect classes needs a decision in
[design-ledger.md](./design-ledger.md), not a line in this list.

## Post-MVP follow-ups

Unscheduled and demand-driven. Take one only when a real agent session needs it:

- machine-readable input shapes. `help` documents every response through
  `successShape`, but the four `--input` commands say only "Path to a JSON
  request file", so the semantic-update sections above are the sole specification and an
  agent has to be pointed at this document to write one;
- transaction update and delete, including their materializer effects;
- `--display-currency` for `debtors list`, which still prints a per-currency
  vector;
- dotted column headers so a deep `--fields` path flattens in `tsv` instead of
  nesting one JSON cell;
- envelope creation, rename, and structure mutation — still out of scope by
  decision, not by omission;
- account balance prediction in previews, which depends on the materializer
  balance rule rather than on the tool.

An MCP adapter is not part of this tool's roadmap. For a maintainer in a
repository checkout, machine-readable `help` over shell already answers what an
MCP schema would. It stays open only as part of the desktop-host question in
[open-decisions.md](../../../../docs/open-decisions.md#1-mcp-inside-a-desktop-host),
where the point is token handling for ordinary users rather than agent
ergonomics. If it ships there, it delegates to these same application
functions, maps one-to-one onto these commands, and adds no logic of its own.

## Verification by change type

| Change                           | Required gate                                                     |
| -------------------------------- | ----------------------------------------------------------------- |
| CLI parsing/output               | focused Node test + tool TypeScript                               |
| state-file persistence           | focused Node test including failure paths                         |
| session/query exposure           | session test + deterministic demo regression                      |
| envelope/budget formatting       | session projection + bounded DTO regression                       |
| budget compiler or routing       | compiler + both storage routes + resulting-state test             |
| local mutation idempotency       | focused retry/conflict + atomic persistence test                  |
| transaction compiler             | compiler + resulting-state + materializer/outbox tests            |
| replica canonical acceptance     | focused replica + reducer integration + default full suite        |
| sync orchestration               | fixture HTTP test + replica/sync integration + default full suite |
| Core entrypoint/package boundary | API boundary + `pnpm zerro-core:package-check`                    |
| read options/output shaping      | focused Node test per option + `help` manifest test               |

Before handing off a slice:

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

The tool is finished, so a continuation changes a working thing rather than
advancing a migration:

1. confirm `cwd` is `/Users/ardov/GitHub/zerro`;
2. run `git status --short`;
3. read this document, [architecture.md](./architecture.md), and the relevant
   section of [testing.md](./testing.md);
4. inspect recent Git commits; Git outranks the prose here;
5. implement one independently testable slice, not a batch of follow-ups;
6. keep the contracts above: bounded JSON, separate preview/stage/sync,
   caller-provided request ids, and `base + outbox` as the only persisted truth;
7. list a new agent-visible option or command under **Shipped after the MVP** in
   the same commit;
8. record any changed boundary in [design-ledger.md](./design-ledger.md);
9. preserve unrelated working-tree changes.

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
