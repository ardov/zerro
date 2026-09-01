# Zerro Finance Replica

Zerro maintains a local, undoable view of a user's ZenMoney data while keeping
the server's accepted state distinct from changes that have not been sent yet.

## Language

### Replica

**Canonical state**:
The latest state accepted from ZenMoney, before any unsent local commands.
_Avoid_: Server cache, raw data

**Replica**:
The canonical state together with the root user's unsent command outbox.
_Avoid_: Local database, account cache

**Backup**:
A complete file exported by Zerro from canonical state.
_Avoid_: Export file, snapshot

**Restore**:
Setting the replica to the state described by a backup or a retained history
point through an undoable command.
_Avoid_: Import, migration

**Foreign backup**:
A complete backup whose root user differs from the signed-in root user. It is
importable, but user-owned entities are rebuilt with new identifiers.
_Avoid_: Foreign import, migration

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

**Push run**:
A fixed prefix of the Outbox captured when a deliberate synchronization starts.
It may be delivered through several requests while later commands wait for the
next run.
_Avoid_: Upload session, background sync

**Chunk**:
One size-bounded request inside a Push run. Its successful response is applied
and persisted before the next Chunk starts.
_Avoid_: Page, batch command

**Cleanup phase**:
The deletion-only tail of a multi-Chunk Push run, after all upserts have been
accepted. Deletions run in reverse dependency order.
_Avoid_: Garbage collection, rollback

**Redo stack**:
Commands undone in the current browser session and available to reapply. It is
never durable.

### Overlays

**Screen**:
An overlay a person can come back to. Its whole content is described by a value
in the address, so Back, Forward and a reload all restore it.
_Avoid_: Route overlay, page dialog

**Popup**:
An overlay Back only dismisses. It lives in memory, dies whenever the page
changes, and holds a history entry without changing the address.
_Avoid_: Trifle, transient, menu

**Slot**:
The history entry a Popup adds. It carries no address of its own and exists to
absorb one Back press.
_Avoid_: Blank entry, placeholder

### Stories

**Bench**:
One instance of a component, driven entirely by args, for a person to turn the
knobs on. The default story of every library component.
_Avoid_: Playground, default story, sandbox

**Showcase**:
Every variant of a component rendered at once, for comparison by eye. It is read,
never operated.
_Avoid_: Variants, gallery, all states

**Scenario**:
A slice of the running application on fixtures, addressed by a route and a
fixture set rather than by props.
_Avoid_: Integration story, page story

**Check**:
A story that exists for its assertions rather than for anyone to look at. It is
kept out of the browsing tree and still runs.
_Avoid_: Test story, play story
