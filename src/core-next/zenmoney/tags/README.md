# Tag

`Tag` is a user-owned ZenMoney category entity. Transactions and ZenMoney tag
budgets can reference tags directly, while Zerro envelope projections may use
tags as envelope sources.

## Reads

The tag read layer exposes direct normalized reads: `getTags` for the entity map
and `getTag` for a nullable lookup by id.

Populated tags and tag trees remain outside this ZenMoney entity slice for now.
They combine normalized tags with user settings and presentation data, so they
should move only when that boundary is made explicit.

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
