# Account

`Account` is a user-owned ZenMoney account. It is one of the first mutable
entities in ZenMoney Core: commands can create, patch, and delete accounts.

## Important Fields And Traps

- `instrument`: currency as an `Instrument` id, not an FX code.
- `company`: optional linked bank/provider company id.
- `balance`: current persisted account balance. Transaction write commands keep
  this in sync by adding account balance effects to transaction patches.
- `startBalance`: regular accounts use it as the starting balance; deposit and
  loan accounts treat it as initial deposit or loan principal.
- `type`: debt accounts are special in balance and envelope logic.
- loan/deposit fields: `capitalization`, `percent`, `startDate`,
  `endDateOffset`, `endDateOffsetInterval`, `payoffStep`, and `payoffInterval`
  are usually null for other account types.
- `changed`: normalized core timestamp in milliseconds. Raw ZenMoney sync data
  uses seconds.

## Mutability

Core account commands currently support create, patch, and normalized deletion.
Deleting an account does not yet perform higher-level merge or transaction
cascade behavior; that belongs to a separate command such as `mergeAccounts`.

`makeAccount` is the production factory for account creation defaults.
It receives deterministic `now` and `uuid` dependencies from `TCoreContext`.
`compileCreateAccount` derives `user` from the root user in the store; callers
should not provide the account owner as command input.

## Reads

The account read layer exposes direct normalized reads and generic account
facts such as the account map, account list, debt account id, and normalized
start balance.

FX resolution is intentionally kept out of the account read layer. Projections
that need currency codes receive an `instrumentCodeById` map and resolve FX
themselves. Zerro-specific conventions such as pinned account titles and the
hidden data account live under `core-next/zerro/accounts`, so the ZenMoney
account reads stay purely about accounts.
