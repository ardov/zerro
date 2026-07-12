# Reminder Marker

`ReminderMarker` is a concrete ZenMoney reminder occurrence. Transactions can
link to a marker through `transaction.reminderMarker`.

## Reads

The read layer exposes `getReminderMarkers(data)` as the normalized marker map.

## Mutability

There is no migrated legacy marker write path in this slice. The module owns the
type and a production factory so future reminder/transaction command work has a
single place for defaults.
