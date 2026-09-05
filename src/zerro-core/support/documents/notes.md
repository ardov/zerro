# Core code map

Paths below are relative to `src/`. Start at the public behavior being changed,
then follow its implementation. [Architecture](./architecture.md) explains the
flows; this page is only a navigation aid.

| Change                              | Start here                                                             | Continue into                                                         |
| ----------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| A view's calculated value           | `zerro-core/runtime/redux/<domain>.ts`                                 | `zerro-core/internal/projections/graph.ts`, then its domain projector |
| Snapshot reads                      | `zerro-core/public/session/createZerroSession.ts`                      | The same projection graph                                             |
| A user command                      | `zerro-core/runtime/redux/commands.ts`                                 | Domain `commands.ts`, then `runtime/redux/executeCommand.ts`          |
| Command replay or predicted effects | `zerro-core/internal/operations/materialization/materializeCommand.ts` | Entity factories, balance and deletion predictors                     |
| Undo / redo                         | `store/data/slice.ts`                                                  | `zerro-core/internal/operations/replication/outbox.ts`                |
| Pull acceptance                     | `store/data/slice.ts` (`applyServerPatch`)                             | `replication/canonical.ts`, `store/data/replicaPersistence.ts`        |
| Push planning / retries             | `4-features/sync.ts`                                                   | `replication/pushRun.ts`, `replication/pushDriver.ts`                 |
| Journal load / retention            | `6-shared/api/replicaStorage.ts`                                       | `replication/linearJournal.ts`, `replication/journal.ts`              |
| History selection                   | `store/history.ts`                                                     | `3-widgets/History/`                                                  |
| Backup parsing / restore            | `6-shared/api/zm-adapter/fullBackup.ts`                                | `zerro-core/internal/operations/restore/`                             |
| Entity reference rules              | `zerro-core/internal/domain/zenmoney/model/entityGraph.ts`             | Validator, restore and push consumers                                 |
| Hidden Zerro data                   | `zerro-core/internal/domain/zerro/hidden-data/`                        | The owning budget, goal, settings, or FX module                       |

`replication/` in the table means
`zerro-core/internal/operations/replication/`.

## Reading cautions

- `current` includes predicted effects; it is not transport or a backup.
- `incomeBankID` and `outcomeBankID` are opaque plugin operation IDs, not
  company references.
- Date shape guards do not establish calendar validity.
- Dynamic entity-map plumbing contains localized type assertions. Follow the
  behavioral tests before replacing it with broader generic machinery.

Future work and the previous working notes are retained in
`private/work/core-simplification/previous-documents.md`; feature decisions also
live under `private/work/`. Those files are not part of this repository.
