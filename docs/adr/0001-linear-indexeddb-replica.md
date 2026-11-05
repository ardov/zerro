# Store the browser replica as one linear IndexedDB journal

The browser stores one replica per root user as a linear sequence of checkpoints
and compact canonical transitions, with the outbox in the replica manifest.
Full synchronization appends a checkpoint rather than creating a branch, and a
schema upgrade destructively removes the old per-domain cache. This favors a
single replay and retention model that one maintainer can reason about; old
formats and concurrent-tab coordination are deliberately unsupported.

## Consequences

Startup replays only from the latest checkpoint, history loads pages and one
selected snapshot lazily, and retention compacts bounded oldest prefixes under
the stricter of the age and byte limits. A future multi-account UI can keep the
same database and partition both stores by root user, but today's runtime keeps
exactly one replica and clears it when the root user changes.
