# Transaction

`Transaction` is a user-owned ZenMoney movement entity. It references accounts,
instruments, optional tags, optional merchant, and optional reminder marker.

## Reads

The transaction read layer exposes direct normalized reads:

- `getTransaction` for a nullable lookup by id;
- `getTransactionsHistory` for legacy-compatible non-deleted history order;
- `getTransactionType` for income/outcome/transfer/debt classification.

`getTransactionsHistory` intentionally filters soft-deleted transactions and
effectively zeroed transactions, then preserves the existing projection order.

## Mutability

Core transaction commands currently cover existing mutation flows:

- soft delete;
- permanent delete by zeroing amounts;
- creation;
- viewed-state update;
- field changes;
- restore under a new id;
- recreate under a durable new id when immutable `created` changes;
- bulk tag/comment edits.

Transaction commands compile intent only. Account-balance expansion belongs to
the final materializer phase; the current identity materializer does not add
those effects yet. `makeTransaction` is the production factory for transaction
creation defaults, and `compileCreateTransaction` derives `user` from the root
user in the store.
