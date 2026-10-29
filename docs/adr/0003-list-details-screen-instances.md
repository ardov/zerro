# Keep list/Details instances in the shared Screen history

Transaction lists and their Details use independent Screen instances in the
existing ordered Screen map. An instance identifies an opening; its value
identifies current financial data. The first Details opening pushes history,
selecting another row updates that instance, and a child list adds another
instance. Explicit list close dismisses its pair; Back dismisses the top
instance. This preserves the existing router and Popup queue as the only
navigation owner.

A list saves its query, search, checked identifiers and exact scroll position
in its serializable value. The host retains current per-instance values across
Back and writes them into the active entry for reload. Entities stay live:
missing selection is pruned, a filtered-out transaction can finish editing,
and an unavailable editor removes itself without removing child lists.

List ownership and the Details content kind are separate from presentation.
The current kind is `transaction`. `ListDetailsSurface` owns geometry, focus
and dismissal; transaction Details owns saving, validation, recreated-id
handover and drafts. A stable `AdaptivePanel` content host preserves pending
input and native scroll across the wide/narrow layout change. Unfinished
input, DOM references, focus targets and callbacks do not enter history.

## Consequences

A wide pair has one modal interaction region containing both panes; a narrow
pair activates Details above the mounted list. Covered surfaces stay mounted
without competing focus boundaries. Presentation derives the active owner
from Screen order, including on initial restoration: simultaneously mounted
independent modal roots otherwise hide each other. Closing returns focus to a
live opener or the newly active surface.
