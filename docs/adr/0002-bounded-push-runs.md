# Deliver large pushes in bounded Chunks

A deliberate Push run captures a fixed Outbox prefix. The default byte limit is 2 MiB of normalized request data as transmitted. Multi-Chunk runs send dependency-ordered upserts, then singleton account deletions, other removals and singleton tags child-first. Account or tag deletion uses Chunk mode even below the limit because it can trigger slow cascades.

Core plans and retries requests. The host measures the body, performs HTTP and persists each acknowledgement before the next Chunk. Each canonical response can remove redundant work from the remainder. The first partial acknowledgement replaces the captured commands with one command containing the unconfirmed items. Later local commands keep their order.

## Consequences

Earlier Chunks remain accepted if a later one stops. Retry derives a fresh run from the remaining Outbox. HTTP 413 can lower the size limit and repack, transient failures can retry the same request, and deterministic errors stop the run. If the response was lost, delivery can repeat. Undo granularity changes after the first acknowledgement. [Planner and delivery loop](../../src/zerro-core/internal/operations/replication/)
