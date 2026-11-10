# Keep one linear IndexedDB journal

The browser keeps one active root-user replica. Its manifest contains the Outbox and cursor. A sequence of checkpoints and compact canonical transitions reconstructs the accepted state. Full reload appends a checkpoint. Changing the root user clears the previous replica.

A linear history lets startup replay only the latest suffix and lets history load individual points on demand. Retention folds bounded oldest prefixes into checkpoints under the stricter of 90 days of server time and 100 MiB of logical journal data. The minimum current state can exceed the limit. Compaction preserves sequence numbers. Writes are ordered per tab. Concurrent tabs have no coordination. [Storage implementation](../../src/6-shared/api/replicaStorage.ts)
