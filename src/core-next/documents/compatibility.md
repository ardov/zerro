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

