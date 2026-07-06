# Transaction

`Transaction` is a user-owned ZenMoney movement entity. It references accounts,
instruments, optional tags, optional merchant, and optional reminder marker.

## Reads

The transaction read layer exposes direct normalized reads:

- `getTransactions` for the entity map;
- `getTransaction` for a nullable lookup by id;
- `getTransactionsHistory` for legacy-compatible non-deleted history order;
- `getTransactionType` for income/outcome/transfer/debt classification.

`getTransactionsHistory` intentionally filters soft-deleted transactions and
effectively zeroed transactions, then preserves the existing projection order.

## Mutability

Core transaction commands currently cover existing mutation flows:

- soft delete;
- permanent delete by zeroing amounts;
- viewed-state update;
- field changes;
- restore under a new id;
- recreate with a replacement transaction;
- bulk tag/comment edits.

Balance effects stay in `effects.ts` and are applied by command compilers. A
production create-transaction factory is not introduced yet because this slice
does not own a create command.
