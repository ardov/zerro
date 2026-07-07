# Reminder

`Reminder` is a ZenMoney scheduled transaction template. It references accounts,
instruments, optional tags, and an optional merchant.

## Reads

The read layer exposes `getReminders(data)` as the normalized reminder map.
Hidden Zerro data also uses reminders as a storage carrier, but the hidden-data
codec stays under `core-next/zerro/hidden-data`.

## Mutability

`compileSetReminder` mirrors the legacy set-reminder flow: it can create or
patch one or more reminders, derives the root user when the draft does not
include one, and validates required income/outcome accounts.

`compileDeleteReminder` emits a normalized deletion patch when the reminder
exists. Missing reminders intentionally compile to an empty patch like the
legacy thunk's no-op dispatch behavior.
