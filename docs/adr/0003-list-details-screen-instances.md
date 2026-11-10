# Give each list and its Details their own Screen instances

Opening a transaction list creates a Screen instance. Opening its first Details pushes a history entry. Selecting another row replaces that Details value. Opening a child list creates a new pair, even for a transaction open elsewhere. Back closes the top instance, and explicitly closing a list closes its pair.

The list saves query, search, checked IDs and scroll position. Restoration reads live entities and prunes missing selections. Unsaved editor input stays in the mounted editor. Switching between columns and a drawer keeps the editor and scrollport alive.

List and Details share one modal focus region when wide. On narrow screens only the top surface traps focus. Screen order identifies the active owner even when several surfaces mount together on reload. Closing returns focus to a live opener or the newly active surface. [Shared presentation](../../src/6-shared/ui/layout/ListDetailsSurface.tsx)
