# Zenmoney domain

[Entities](entities/) define normalized records, factories, writable fields and compilers. The [reference graph](model/entityGraph.ts) supplies dependencies for validation, restore and push. `TZm*` types describe wire differences, including timestamps in seconds. Core stores milliseconds.

Compilers express sparse intent. The [materializer](../../../support/documents/materialization.md) predicts balance changes and cascades for local reads. [applyPatch](model/applyPatch.ts) applies the explicit changes it receives. Dictionaries such as instruments and countries are read-only. Zerro envelope budgets and hidden data belong to the adjacent [Zerro domain](../zerro/).

[Transaction rules](entities/transactions/README.md) · [Sync contract](sync-api.md)
