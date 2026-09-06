# ZenMoney domain

This module owns normalized ZenMoney entities, their factories and command
compilers, and reads over accounts and transaction history. Zerro-specific
budgets, envelopes, hidden data, and FX live in the adjacent `zerro/` domain.

## Where to start

| Location                  | What it owns                                                  |
| ------------------------- | ------------------------------------------------------------- |
| `primitives.ts`           | Timestamp units and shared primitives                         |
| `entities/`               | Entity types, defaults, writable fields, reads, and compilers |
| `model/store.ts`          | Normalized store and patch types                              |
| `model/entityGraph.ts`    | Entity references and dependency order                        |
| `model/validateStore.ts`  | Store consistency checks                                      |
| `model/applyPatch.ts`     | Applying explicit entity changes                              |
| `read-models/debtors.ts`  | Debt balances derived from transactions                       |
| `read-models/balances.ts` | Account balance history                                       |

Read reference entities (`instruments`, `countries`, `companies`) first, then
users, merchants, tags, and accounts. Budgets and reminders refer to those
entities; reminder markers refer to reminders. [Transactions](./entities/transactions/README.md)
combine those references and feed the derived read models.

## Types and boundaries

Core types describe normalized application data. Wire types use the `TZm*`
prefix where the protocol differs: for example, `changed` is milliseconds in
Core and Unix seconds on the wire. Field comments and factories are the
reference for individual fields and defaults.

Entity reads expose maps and domain facts. Currency conversion, localized
labels, pinned-account conventions, and the hidden Zerro data account belong
outside this module. ZenMoney tag budgets are separate from Zerro envelope
budgets stored in hidden data.

Compilers produce sparse intent. They do not update balances or discover
cascades. The [materializer](../../../support/documents/architecture.md#materialization)
expands intent and predicts those effects for local state. Transport sends only
primary changes; server responses carry canonical balances and cascades.
`applyPatch` applies either explicit patch without inventing additional effects.

Reminder markers have a factory and writable-field definitions but no dedicated
entity command compiler. Reference dictionaries have no user commands.

## Protocol reference

[sync-api.md](./sync-api.md) records observed server behavior and its limits.
For replication, persistence, and restore, continue with the
[Core reading guide](../../../support/documents/README.md).
