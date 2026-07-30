# zerro CLI

A local, JSON-in-JSON-out CLI over your ZenMoney data. Every command prints one
JSON line to stdout: `{ schemaVersion, ok, command, effect, meta, data }` on
success, `{ schemaVersion, ok: false, command, effect, error }` on failure.
Nothing about the shape of a command's `data` is guessed — see **Discovering
a command** below.

## Before anything else

```bash
pnpm -s zerro help
```

`pnpm` prints its own banner before the command's JSON; `-s` (silent)
suppresses it so stdout is pure JSON. Every example below assumes `-s`. If you
forget it, take the last line of output instead of piping the whole thing to
`jq`.

## The four-stage model

1. **`refresh`** — pulls changes from ZenMoney into the local state file
   (`~/.zerro/state-v1.json`). Requires `ZM_TOKEN` (env var, or a
   `ZM_TOKEN=...` line in `.env.local` at the repo root). This is the only
   command that talks to the network besides `sync`.
2. **Reads** (`effect: "none"`) — `accounts list`, `transactions search`,
   `month get`, `envelopes list`, `report activity`, etc. Pure local reads off
   the last `refresh`. Never touch the network or the state file.
3. **`preview-*` / `stage-*`** (`effect: "none"` / `"local"`) — `budget
preview-set` / `budget stage-set`, `transaction preview-create` /
   `transaction stage-create`. `preview-*` computes what a change would do
   without writing anything. `stage-*` writes it to a local outbox, guarded by
   a caller-chosen `--request-id` so retries are idempotent. Nothing reaches
   ZenMoney yet.
4. **`sync`** — sends the staged outbox to ZenMoney (`effect: "remote"`,
   requires `ZM_TOKEN` if the outbox is non-empty). `outbox list` shows what's
   staged; `outbox undo --request-id ...` reverts a staged command before it's
   synced.

Nothing mutates your ZenMoney account except `sync`. Everything through
`stage-*` is local and reversible via `outbox undo`.

## Discovering a command

```bash
pnpm -s zerro help                          # every command: options, example, successShape
pnpm -s zerro help --shape reportPage       # one-line docs for every field of that response
```

`help`'s `data.guide` is worth reading once — it covers `--format tsv`,
multi-currency amounts, the `warnings` array, and a zsh/bash pipe gotcha
(below). Every command in the manifest names a `successShape`; look it up with
`help --shape <name>` instead of guessing field names or reading source.

## Exit codes

| Code | Meaning                                                                                                                                                                                                |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0    | success                                                                                                                                                                                                |
| 2    | bad input, nothing attempted — `INVALID_INPUT`, `INVALID_COMMAND`, `INVALID_CURSOR`, `INVALID_REQUEST_ID`, `INVALID_ENDPOINT`, `INPUT_READ_FAILED`, `CURRENCY_MISMATCH`                                |
| 3    | valid input, nothing to do — `ENTITY_NOT_FOUND`, `MONTH_NOT_FOUND`, `NO_CHANGES`, `OUTBOX_EMPTY`                                                                                                       |
| 4    | missing prerequisite — `STATE_NOT_INITIALIZED` (run `refresh` first), `TOKEN_REQUIRED`                                                                                                                 |
| 5    | local failure, no change applied — `INTERNAL_ERROR`, `INVALID_STATE`, `STATE_READ_FAILED`, `STATE_WRITE_FAILED`, `IDEMPOTENCY_CONFLICT`, `INVALID_RECEIPT`, `OUTBOX_NO_TRANSPORT`, `ENDPOINT_MISMATCH` |
| 6    | ZenMoney transport or response — `NETWORK_FAILURE`, `ZENMONEY_REJECTED`, `INVALID_ZENMONEY_RESPONSE`                                                                                                   |

Exit code 6 is the only class where the write may or may not have reached
ZenMoney: check `error.outcome` (`not_applied` vs `unknown`) and
`error.retryable` before retrying, and never retry `sync` blindly after
`unknown`. `help` lists the error codes each command can return.

## A shell gotcha that will corrupt your JSON

zsh/bash's builtin `echo` unescapes `\n` in a string before `jq` ever sees it,
so a transaction comment with a literal newline in it will silently split
across two lines and break `jq`'s parser:

```bash
# Wrong — corrupts multi-line comments:
echo "$json" | jq .

# Right:
printf '%s' "$json" | jq .
# or just pipe the command's own output directly:
pnpm -s zerro transactions search --from 2026-07-01 --to 2026-07-31 | jq .
```

## Recipes

`--fields` + `--format tsv` gives a clean flat table only when every
requested path is exactly one level under `items` (e.g. `items.name`) — a
deeper path like `items.withChildren.converted.available` still projects
correctly, but nests into one JSON-blob column rather than flattening, since
`--fields` builds nested objects, not dotted column headers. For anything
deeper than one level, pipe the plain JSON through `jq` instead, as in a
couple of the recipes below.

Spending by tag for a month, net of refunds, converted to one currency:

```bash
pnpm -s zerro report activity --group-by tag --from 2026-07-01 --to 2026-07-31 \
  --display-currency RUB --fields items.name,items.totalConverted --format tsv
```

Monthly funds trend:

```bash
pnpm -s zerro months list --from 2026-01 --to 2026-07 --display-currency RUB \
  | jq -r '.data.items[] | [.month, .totalsConverted.fundsStart, .totalsConverted.fundsChange] | @tsv'
```

Top merchants over a period:

```bash
pnpm -s zerro report activity --group-by merchant --from 2026-01-01 --to 2026-07-31 \
  --display-currency RUB --limit 20 --format tsv
```

Every account's balance and whether it counts toward the budget:

```bash
pnpm -s zerro accounts list --display-currency RUB \
  --fields items.title,items.balanceConverted,items.inBalance --format tsv
```

Which envelopes are overspent this month:

```bash
pnpm -s zerro envelopes list --month 2026-07 --display-currency RUB --roots-only \
  | jq -r '.data.items[] | select(.withChildren.converted.available < 0) | [.name, .withChildren.converted.available] | @tsv'
```

Only outgoing transfers between your own accounts (money moved, not spent):

```bash
pnpm -s zerro transactions search --from 2026-07-01 --to 2026-07-31 --type transfer
```

Who owes money right now (`debtors list` has no --display-currency yet, so a
debtor owed in more than one currency prints as a vector):

```bash
pnpm -s zerro debtors list --fields items.name,items.balance --format tsv
```

What's staged locally but not yet sent to ZenMoney:

```bash
pnpm -s zerro outbox list
```

## Development

```bash
pnpm --filter zerro exec vitest    # or: pnpm test -- tools/zerro
pnpm typecheck                     # also type-checks tools/zerro/tsconfig.json
```

The contract behind this tool — state model, mutation rules, output guarantees,
and what stays deliberately out of scope — is
[local-tooling.md](../../src/zerro-core/support/documents/local-tooling.md).
