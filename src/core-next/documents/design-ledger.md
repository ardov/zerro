# Core Next design ledger

- Updated: 2026-07-10
- Purpose: keep settled decisions, unresolved questions, and temporary bridges
  in one place.

## Settled decisions

### Package boundary

- The root `core-next` entrypoint is the semantic facade.
- `core-next/zenmoney` and `core-next/zerro` are internal migration paths, not
  supported app-facing APIs.
- Redux selectors and commands use an explicit adapter entrypoint and are not
  re-exported from root.
- Production Core imports no runtime values from app layers or `6-shared`.

### Facade and reads

- Public reads are grouped by domain and use implemented `get*` names, for
  example `session.envelopes.getAll()`.
- A session represents one immutable snapshot and memoizes each internal node
  once.
- Redux owns cross-snapshot memoization and keeps selectors granular.
- Internal graph nodes need not appear on the semantic root facade.
- A small readable graph map is preferred over a generic dependency framework.
- Flat `session.read.*` is deprecated compatibility until parity and fixture
  consumers move.

### Domain and presentation

- Domain envelopes and presentation envelopes are different contracts.
- Localization, generated appearance, emoji, SVG URLs, and bank logos are not
  domain state.
- Reusable appearance policy and catalogs may live in an optional presentation
  package or package subpath with adapter-provided localization/assets.
- Write commands resolve against domain envelopes, never decorated views.
- The Redux command adapter maps localized default-group labels back to stable
  domain ids before compilation.

### Commands, materialization, and replay

- Commands use narrow semantic inputs instead of `Partial<FullEntity>` or
  `Partial<Projection>`.
- Singular commands are the default; bulk APIs are added only with explicit
  atomicity and error semantics.
- Command compilers produce intent patches.
- Every local patch passes through `materializePatch`; the first implementation
  is identity-only.
- Server-like materializer rules are the final migration phase; keep the layer
  identity-only while the public API, replica, package, and legacy boundaries
  are still moving.
- Canonical server diffs bypass local materialization.
- The outbox stores `command`, `intentPatch`, `appliedPatch`, and
  `materializerVersion`.
- Replay uses stored `appliedPatch`; it does not recompile commands or
  rematerialize history.
- Dumb `applyPatch` applies only explicit changes.

### Replica and conflicts

- Redux remains the sole reactive replica owner in the React app.
- The in-memory engine is a reference/headless runtime, not a parallel app
  store.
- Undo/redo move `outboxHead`; inverse patches are not stored.
- First-stage conflict resolution is entity-level last write wins, including
  hidden-data blobs.

### Testing

- Use focused unit tests for domain rules and contracts.
- Use deterministic demo data for representative public graph regressions.
- Use private fixtures only for opt-in high-confidence parity.
- Private failures compare hashes or safe summaries, never raw objects.
- Trivial map-lookup tests are low value unless they protect extra semantics.

## Open questions

### Package surface

1. Which supported subpaths should exist besides root and the Redux adapter?
2. Are `demo`, `testing`, `materializer`, and future `presentation` official
   package entrypoints or repo-local adapter SPI?
3. When should package `exports` and generated declaration consumer tests
   enforce the boundary?

### Presentation package

1. Should appearance policy and binary/vector assets ship in one package or in
   separate `presentation`, `tag-icons`, and `bank-logos` subpaths?
2. Should SVGs be inline strings, URLs, imported modules, or adapter-resolved
   handles?
3. How should unknown tag icon and bank company ids degrade?

### Materializer and sync

1. Once materialization is non-identity, should ZenMoney sync send
   `intentPatch`, `appliedPatch`, or use a per-command transport encoder?
2. Which real ZenMoney responses should become parity fixtures for account
   deletion and transfer conversion?
3. When rules change, do pending entries keep old applied effects until replay,
   or require an explicit outbox migration?

### Replica

1. What is the minimum public command set for the first Redux-backed engine?
2. What metadata belongs in `inbox`: patch, timestamps, summary, or conflict
   diagnostics?
3. What happens to the redo tail after successful sync?
4. When should remote changes be applied automatically versus deferred?

### Demo data

1. Is `makeDemoStore` enough, or should demo expose a ready engine/runtime?
2. Which distinct scenarios justify maintenance: sparse history,
   multi-currency savings, debt-heavy data, or malformed hidden data?

## Active compatibility bridges

### Direct Redux client patches

Status: semantic funnel commands append complete runtime outbox entries, but
reminder writes, hidden data-account bootstrap, and the debug API still call
`applyClientPatch` directly. Redux therefore continues maintaining `current`
and `diff` as compatibility views, and the runtime outbox is not yet the sole
replay authority.

Exit one producer at a time. Prefer semantic commands for domain writes and an
explicit infrastructure entry shape for bootstrap/debug writes; do not wrap
them in another generic public legacy command.

### `src/demoData`

Status: thin wrapper over `core-next/demo`.

Exit when app and story consumers import the supported demo entrypoint or an
app-specific adapter.

### `6-shared/types`

Status: compatibility facade re-exporting Core-owned normalized entities,
store/patch shapes, and `DataEntity`.

Exit gradually as app/domain consumers use supported Core types. Do not perform
a big-bang type move.

### Deep implementation imports

Status: migration debt.

Current examples include app or compatibility imports from:

```txt
core-next/zenmoney
core-next/zenmoney/users/types
core-next/zerro/goals
core-next/patch
core-next/adapters/redux/tagPresentation
```

Exit one consumer at a time after its semantic root or adapter API exists.
Do not solve this by exporting entire internal barrels from root.

### Legacy tag icon files

Status: `core-next/tag-icons` owns package-safe emoji metadata, while
`6-shared/tagIcons.json` and `6-shared/tagIconsSvg.ts` remain compatibility and
app-asset sources.

Exit after the presentation-package decision and consumer migration. Concrete
SVG URLs must remain outside domain Core.

### Legacy local diff

Status: Redux still accumulates `data.diff`; the identity materializer means
intent and applied patches are currently equal.

Exit when Redux owns explicit `base`, `outbox`, `outboxHead`, `inbox`, and
replayed `current`. Resolve the sync transport question before enabling
non-identity rules.

## Resolved bridges

### Legacy patch command

Resolved on 2026-07-11. After the account merge migration removed the final
production consumer, the `legacy.patch` command, `applyLegacyPatch` thunk and
adapter export, source file, and bridge-only tests were deleted. The Redux
adapter command export list is pinned by `api-boundary.test.ts`.

### Envelope partial-patch command

Resolved on 2026-07-10. The semantic structure slice removed the last app
consumer; the retire slice then deleted `envelopeModel.patchEnvelope`, the
`zerro.envelope.patch` command, and app-layer `TEnvelopeDraft` exports.
Envelope drafts remain internal to Core compile functions.

### `populatedTags` session dependency

Resolved on 2026-07-10. Sessions build domain envelopes from normalized Core
tag structure; the Redux adapter decorates them afterward. Envelope commands
resolve against the domain selector.

### Production `6-shared/helpers` imports

Resolved on 2026-07-10. Core owns its internal date, money, key, color, and
utility implementations. `api-boundary.test.ts` protects this direction.

## How to update this ledger

- Move an answer from Open Questions to Settled Decisions when the choice is
  explicit and implemented or accepted.
- Remove a compatibility bridge only in the slice that removes its last real
  consumer.
- Record the exit condition, not a vague intention to clean it up later.
- Keep chronological implementation detail in Git, not here.
