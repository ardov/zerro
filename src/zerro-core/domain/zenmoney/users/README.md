# User

`User` represents ZenMoney account ownership data. Most app logic cares about
the root user: the user record without a parent.

## Important Fields And Traps

- `currency`: base currency as an `Instrument` id. Use `getUserCurrency` when
  an FX code is needed.
- `parent`: root user has `null`; child users point to another user id.

## Mutability

Users are synchronized account metadata. Core commands do not create, patch, or
delete users.

## Notes

When a command needs ownership, derive the root user from data instead of
hardcoding a user id.
