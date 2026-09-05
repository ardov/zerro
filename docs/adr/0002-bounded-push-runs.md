# Send large pushes as durable bounded Chunks

A deliberate Push run captures the current Outbox prefix and sends it either as
one request or as a sequence of requests whose serialized normalized bodies are
bounded to 2 MiB. Multi-Chunk runs send dependency-ordered upserts first, then
singleton-account Cleanup Chunks, then surviving removals with child-first
singleton tags last. Upsert order is derived from the shared
entity reference graph; Cleanup order is declared alongside it from observed
server cascade behavior. Core owns planning, exact item receipts and the
delivery loop — retry classification, backoff and repacking. The host owns HTTP,
persistence and presentation, and measures the representation it transmits. Account or tag phases force a run into multi-Chunk mode
even below 2 MiB, including a single slow deletion, so progress and recovery
remain explicit.

Each accepted Chunk is applied and persisted before the next request. The first
acknowledgement replaces the captured prefix with one command containing the
unconfirmed remainder, so a reload can resume through an ordinary future Push
run without a durable run marker. A stopped run resumes the same way: retrying
re-derives the run from the replica and carries nothing but the byte limit an
HTTP 413 established. A request whose response is not processed remains pending
and may be delivered again.

Every browser Push publishes fixed per-entity progress. Large and cascade-prone
runs open an adaptive details surface automatically; ordinary runs expose it
through the sync button. Hiding the surface does not affect delivery. The same
button shows aggregate determinate progress plus an in-flight marker and
reopens sending, waiting, or stopped details.

Applying every canonical response before preparing the next Chunk is also the
Cleanup pruning mechanism: if an account cascade already removed a pending
reminder, marker, or other row, rematerialization drops its now-redundant
removal. Rows retained by the server remain pending instead of being guessed
away client-side. Transactions wholly contained in deleted accounts are the
verified exception and are omitted before transport.

## Consequences

Large restores no longer depend on the server accepting one large atomic body,
but a multi-Chunk Push run is not atomic: earlier Chunks remain accepted if a
later one stops. HTTP 413 can repack the same remainder, transient errors can
retry the exact request, and deterministic errors stop without skipping data.
Every accepted Chunk is a separate canonical history transition; original
per-command undo history is lost at the first accepted Chunk.
