# Core Next Compatibility Ledger

Date: 2026-07-07

This document tracks intentional temporary bridges that should be revisited
before Core Next becomes a standalone package.

## Active Bridges

### `src/demoData`

Status: compatibility wrapper.

`src/core-next/demo` owns deterministic demo generation. The old `src/demoData`
entrypoint re-exports `getDemoData`, `makeDemoDiff`, and `makeDemoStore` so the
current app and stories can keep importing `demoData` while ownership moves.

Exit: update app/story imports to `core-next/demo` or an app-specific demo
adapter, then remove `src/demoData`.

### `6-shared/types`

Status: compatibility facade.

`6-shared/types` re-exports migrated ZenMoney entity types and `DataEntity` from
Core Next so legacy code can keep compiling during the migration.

Exit: app/domain code imports domain types from Core Next or an app-level type
facade; `6-shared/types` stops being the cross-layer domain source.

### `6-shared/helpers` value imports

Status: undeclared dependency, now tracked.

Production core code imports small pure helpers from `6-shared/helpers` as
runtime values: `keys`, date helpers (`toISODate`, `toISOMonth`, ...), money
helpers (`round`, `addFxAmount`, ...), and color helpers. Types from
`6-shared/types` are a declared bridge, but these value imports would follow
the module into a package.

Exit: copy the needed helpers into `core-next/shared` (duplication is
accepted), switch internal imports, then extend `api-boundary.test.ts` to
forbid `6-shared` value imports from production core entirely.

### `populatedTags` session read dependency

Status: app-adapter presentation dependency.

The Redux adapter now derives tag structure from normalized Core tags, then
adds localized `null` and SVG/emoji symbols in
`adapters/redux/tagPresentation.ts`. `createZerroSession` still takes prepared
`populatedTags`, because it must stay independent of i18n and app assets. This
continues to block true headless envelope reads.

Exit: session accepts the Core tag structure directly and adapters add localized
labels and SVG URLs on top, the same way default envelope group labels are
handled.

### Deep implementation imports from app code

Status: migration bridge.

A few app files import Core Next implementation subpaths directly instead of a
facade: `TrContextMenu` takes `getTransactionType` from `core-next/zenmoney`,
and the `5-entities/tag` shims (`makeTag`, `populateTags`) take `nullTag` /
`populateTags` from `core-next/adapters/redux/tagPresentation`. The deep
adapter path is deliberate for the tag shims: importing the adapter index would
pull the whole selector graph into the `5-entities/tag` module graph.

Exit: pure domain helpers get a package-safe facade entrypoint (root facade or
a dedicated helpers subpath), and the tag shims disappear once their consumers
import the adapter directly.

### `6-shared/tagIcons.json`

Status: legacy compatibility catalog.

`src/core-next/tag-icons` now owns the package-safe `id -> emoji` catalog and
lookup helpers. The old JSON file remains for legacy imports.

Exit: switch legacy icon consumers to `core-next/tag-icons`, then remove or
generate the old JSON compatibility file.

### `6-shared/tagIconsSvg.ts`

Status: app asset adapter.

The SVG URL map still imports app-bundled SVG files from `6-shared/icons`. Core
Next does not own those URLs yet; `core-next/tag-icons` can accept an external
`svgById` map when a consumer wants SVG URLs.

Exit: decide whether SVG assets belong in Core Next. If yes, move/copy assets
behind a package-safe entrypoint. If no, keep SVG URL resolution as an app
adapter.

## Guardrails

- Root `core-next` stays facade-only.
- Implementation subpaths such as `core-next/zenmoney` and `core-next/zerro`
  are migration/internal paths, not public package API.
- Optional package-safe subpaths such as `core-next/demo` and
  `core-next/tag-icons` must not import Redux, React, `5-entities`, i18n, or
  app-only assets directly.
