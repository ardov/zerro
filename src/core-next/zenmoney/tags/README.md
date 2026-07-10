# Tag

`Tag` is a user-owned ZenMoney category entity. Transactions and ZenMoney tag
budgets can reference tags directly, while Zerro envelope projections may use
tags as envelope sources.

## Reads

The tag read layer exposes direct normalized reads: `getTags` for the entity map
and `getTag` for a nullable lookup by id. `buildTagStructure` derives stable,
presentation-neutral names, unique names, children, and configured color values
from raw tags.

Generated/display colors, SVG URLs, localized labels, and the synthetic
uncategorized tag remain outside this ZenMoney entity slice. The app adapter
decorates Core tag structure with those presentation concerns.

## Mutability

Core tag commands currently support create and patch semantics. Creating with an
existing id routes through patch semantics to preserve the legacy behavior.

`makeTag` is the production factory for ordinary tag creation defaults. The
localized `null` sentinel tag stays outside this ZenMoney entity slice because
it depends on i18n and is not a real normalized ZenMoney tag.

Zerro envelope projections still need a stable `tag#null` envelope for
uncategorized transactions and ZenMoney budgets with `tag: null`. That fallback
is created in `core-next/zerro/envelopes` as a non-localized projection source;
adapters remain responsible for localized display text.
