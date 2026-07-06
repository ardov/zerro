# Merchant

`Merchant` is a user-owned ZenMoney payee normalization entity. Transactions can
reference a merchant directly, and Zerro projections use merchants when building
debtor and envelope-like views.

## Reads

The merchant read layer exposes direct normalized reads: `getMerchants` for the
entity map and `getMerchant` for a nullable lookup by id.

## Mutability

Core merchant commands currently support patching existing merchants. The
production `makeMerchant` factory captures creation defaults for future command
work without making test builders responsible for production behavior.
