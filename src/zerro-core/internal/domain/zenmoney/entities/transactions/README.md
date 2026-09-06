# Transactions

A transaction records income and outcome legs, each with an account, instrument,
and amount. It may also refer to tags, a merchant, or a reminder marker.
Account legs can be null on soft-deleted server rows; live rows require valid
accounts.

## Reading the module

- `types.ts` defines normalized and wire shapes.
- `factory.ts` supplies creation defaults.
- `read.ts` owns lookup, ordering, visibility, and transaction classification.
- `filtering.ts` applies transaction filters.
- `commands.ts` compiles creation, field/viewed updates, bulk edits, soft and
  permanent deletion, and restoration under a new id.

`getSortedTransactions` includes deleted rows. `getTransactionsHistory` filters
soft-deleted rows and rows with both amounts below `0.0001`; that visibility
threshold is not the server's purge rule. `getTransactionType` distinguishes
income, outcome, transfer, and the two debt directions.

## Writes

Commands record intent only. `compileCreateTransaction` uses the store's root
user and the production factory. Restore uses a new id because server deletion
is irreversible; changing immutable `created` also recreates the transaction.

The materializer predicts balance changes and deletion effects for immediate
local reads. Transport omits those predictions and sends full entities expanded
from primary intent. See [materialization rules](../../../../../support/documents/materialization.md)
and [observed sync behavior](../../sync-api.md#deletion-semantics).
