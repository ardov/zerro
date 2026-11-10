# Core design decisions

Redux owns the live replica. Pure operations can replay the same Outbox for the browser, a snapshot consumer or a test without maintaining another mutable store. Explicit entrypoints and boundary tests keep Core isolated inside the source tree without a separately versioned package. [Architecture](architecture.md)

## Reads and Redux adapter

The shared projection graph depends on granular input references. Cache allocating inputs as well as expensive calculations when their identity matters downstream. For example, renaming an account can retain the same in-budget account IDs and reuse transaction activity.

## Restore

A backup exports the canonical base, excluding unsent commands. Exporting and restoring do not trigger a push. The planner compares the desired state with `current`, previews with temporary IDs, then replans against live state when confirmed. An intervening pull can change the final counts. Applying restore appends an undoable command and preserves the canonical journal. [Restore planner](../../internal/operations/restore/diffStores.ts)

- Update live same-ID entities. A missing ID may be permanently tombstoned. Allocate a fresh ID and remap dependents, or reuse an eligible exact semantic match.
- Match ordinary accounts only by ID. A lookalike could retain unwanted transactions. Repeating a restore with absent account IDs can therefore rebuild accounts again.
- Map the backup root user and debt account to the signed-in root and protected debt singleton. Remap supported hidden payloads. Keep account `syncID` for bank importers. Reference dictionaries are read-only, and billing and subscription data stay outside writes.
- Skip soft-deleted transactions in the desired state. Transaction removal ordinarily soft-deletes, budget removal zeroes amounts, and other writable entities use protocol deletions. Omit transaction removals covered by account cascades and protect merchants referenced by active debts.

Structural errors, including missing required collections, duplicate identities, invalid required references and cycles, block restore. Unknown fields and business values may produce a warning and **Restore anyway**. A different root user requires explicit confirmation. A readable snapshot can include data that the API cannot recreate. [Protocol exceptions](../../internal/domain/zenmoney/sync-api.md#snapshot-compatibility)

## History

Redo and local commands appear above canonical points, even if a pull arrived later. Checkpoints have no per-point diff. Canonical rows summarize stored transitions. Command labels describe local actions until acknowledgment. Detailed historical comparisons load the selected point and can inspect both versions of a hidden payload.

## Accepted risks

A successful response acknowledges its Chunk even when Zenmoney silently drops a field. Earlier Chunks remain accepted if a later one stops. An unprocessed response leaves delivery uncertain. Retention can remove the point preceding a restore. Browser storage is best effort after a primary write failure, and active tabs have independent write queues. [Bounded pushes](../../../../docs/adr/0002-bounded-push-runs.md) · [Linear journal](../../../../docs/adr/0001-linear-indexeddb-replica.md)
