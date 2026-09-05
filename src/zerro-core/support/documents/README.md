# Zerro Core

Core turns ZenMoney data and local commands into the state Zerro displays. It
owns domain rules and calculations; Redux owns the live replica, and browser
adapters own HTTP and IndexedDB.

Start with [architecture.md](./architecture.md). It follows a command, a server
response, and a read through the code. The vocabulary is in
[CONTEXT.md](../../../../CONTEXT.md).

| Document                                                        | Read it for                                       |
| --------------------------------------------------------------- | ------------------------------------------------- |
| [Architecture](./architecture.md)                               | State, command flow, reads, sync, and persistence |
| [Design decisions](./design-ledger.md)                          | Reasons, tradeoffs, and restore rules             |
| [Materialization](./materialization.md)                         | Exact predicted server effects and their evidence |
| [Code map](./notes.md)                                          | Where to make a particular change                 |
| [Testing](./testing.md)                                         | Required checks and useful test surfaces          |
| [ZenMoney protocol](../../internal/domain/zenmoney/sync-api.md) | Observed wire behavior                            |

These documents describe the current implementation. Plans and open questions
live in `private/work/` and `private/open-decisions.md`, which are not part of
this repository. Implementation history belongs in Git.
