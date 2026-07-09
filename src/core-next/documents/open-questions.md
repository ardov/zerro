# Core Next Open Questions

Date: 2026-07-07

This document tracks product and architecture decisions that should not be
settled accidentally by implementation momentum.

## Package Surface

1. Which subpaths should be documented as supported package APIs besides the
   root facade?
2. Should `core-next/demo` be an official optional package entrypoint, or only a
   repo-local development helper?
3. Should `core-next/tag-icons` be an official optional package entrypoint, and
   should it eventually own SVG strings/files as well as emoji metadata?

## Demo Data

1. Should demo generation expose `createDemoZerroEngine(options)` directly, or
   is `makeDemoStore(options)` enough for now?
2. Which extra public demo scenarios are worth maintaining: sparse history,
   multi-currency savings, debt-heavy accounts, goals-heavy accounts, or
   malformed hidden data?
3. Should demo reference data stay hand-authored, or should it be generated from
   a documented ZenMoney fixture/schema source?

## Tag Icons

1. Is the canonical ZenMoney icon catalog only `id -> emoji`, or should SVG
   assets also be owned by Core Next?
2. If Core Next owns SVG assets, should it expose inline SVG strings,
   bundler-resolved URLs, or an adapter hook for consumers to provide URLs?
3. Should invalid tag icon ids be preserved, normalized to `null`, or reported
   through validation diagnostics?

## Engine And Sync

1. What command set is the minimum useful public engine API?
2. Should the redo tail be preserved after successful sync, or can it be
   cleared?
3. What exact metadata belongs in `inbox`: patch only, server timestamps,
   preview summaries, or conflict diagnostics?
4. How should pending remote changes be shown in the UI?

Settled: conflict resolution is entity-level last write wins, including
hidden-data blobs. See "Conflict semantics" in
[architecture.md](./architecture.md) for rationale and revisit triggers.

## Compatibility Exit Criteria

1. When can `src/demoData` be removed as a compatibility wrapper?
2. When can `6-shared/types` stop re-exporting Core Next entity types?
3. When can legacy tag icon maps under `6-shared` be replaced by
   `core-next/tag-icons` plus an app asset adapter?

