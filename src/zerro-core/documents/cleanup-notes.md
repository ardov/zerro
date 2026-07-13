# Zerro Core cleanup notes

- Updated: 2026-07-13
- Purpose: concrete local smells that do not yet justify architectural work.

This is not a second roadmap. Immediate closure work lives in `roadmap.md`;
remove a note when it is fixed or promoted into a decision.

## Deferred local cleanup

### Dynamic normalized-patch plumbing

`domain/zenmoney/applyPatch.ts` and
`domain/zerro/hidden-data/write.ts#mergeNormalizedPatches` use dynamic entity
keys and still need `@ts-expect-error` or `as never`. The behavior is
centralized and tested. If these files change for domain reasons, prefer one
small explicit entity-map helper over a mapped-type framework.

### Broad transaction edit input

`TTransactionPatch` derives from most of `TTransaction`, so stored-entity shape
changes can leak into the command API. Replace it with a handwritten
optional-field input when the transaction editor or materializer next changes.

### Reminder command atomicity

Reminder `set` accepts create drafts, update patches, arrays, and mixed arrays.
Split create/update/bulk commands only when a new use case defines receipts,
partial failure, and atomicity.

### Date guards validate shape only

`isISODate` and `isISOMonth` accept correctly shaped invalid calendar values.
Add calendar validation only at a boundary with a demonstrated bad-data case.

### Payee envelope rename

One visible payee may represent several raw transaction spellings. Renaming
needs a product rule; keep the explicit unsupported case instead of a type or
patch workaround.

## Tooling cleanup after the closure gate

### Knip entrypoints

The current report contains useful candidates but is not deletion authority
until the real Vite application entrypoint, worker, tests, and package consumer
are modeled. After configuration, remove exports with no runtime, test, or
supported-consumer use.

### Adapter member audit

The namespace-first Redux adapter is the desired shape, but some members may be
historical or speculative. Remove unconsumed members; do not replace namespaces
with a flat barrel.
