# Zerro Finance Replica

Zerro maintains a local, undoable view of a user's ZenMoney data while keeping
the server's accepted state distinct from changes that have not been sent yet.

## Language

**Canonical state**:
The latest state accepted from ZenMoney, before any unsent local commands.
_Avoid_: Server cache, raw data

**Replica**:
The canonical state together with the root user's unsent command outbox.
_Avoid_: Local database, account cache

**Canonical journal**:
The retained linear history of canonical states, beginning at a checkpoint and
continuing through server transitions.
_Avoid_: Branch, event log

**Checkpoint**:
A complete canonical state from which later journal transitions can be replayed.
_Avoid_: Branch root, backup

**Transition**:
A compact change between consecutive canonical states. An empty pull is not a
transition.
_Avoid_: Patch response, event

**Outbox**:
The ordered, durable commands applied locally but not yet accepted by ZenMoney.
It is also the durable undo stack.
_Avoid_: Local journal, pending patch

**Redo stack**:
Commands undone in the current browser session and available to reapply. It is
never durable.
