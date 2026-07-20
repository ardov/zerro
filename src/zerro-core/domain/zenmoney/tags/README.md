# Tag

`Tag` is a user-owned ZenMoney category entity. Transactions and ZenMoney tag
budgets can reference tags directly, while Zerro envelope projections may use
tags as envelope sources.

## Reads

The tag read layer exposes direct normalized reads: `getTags` for the entity map
and `getTag` for a nullable lookup by id. Derived display names, duplicate-name
labels, child lists, formatted colors, icons, and the synthetic uncategorized
tag remain outside this ZenMoney entity slice. The app adapter derives that
presentation model directly from raw tags.

## Mutability

Core tag commands currently support create and patch semantics. Creating with an
existing id routes through patch semantics to preserve the legacy behavior.

`makeTag` is the production factory for ordinary tag creation defaults. The
localized `null` sentinel tag stays outside this ZenMoney entity slice because
it depends on i18n and is not a real normalized ZenMoney tag.

Zerro envelope projections still need a stable `tag#null` envelope for
uncategorized transactions and ZenMoney budgets with `tag: null`. That fallback
is created in `zerro-core/domain/zerro/envelopes` as a non-localized projection source;
adapters remain responsible for localized display text.
