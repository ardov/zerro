import type { OverlayEntry } from './decide'

/** Values can outlive a history entry; membership and order cannot. Removed
 * entities leave a tombstone so older entries never resurrect their editor. */
export type ScreenMemory = Record<
  string,
  { value: unknown; revision: number; removed?: false } | { removed: true }
>

export function remember(
  memory: ScreenMemory,
  entry: OverlayEntry
): ScreenMemory {
  let next = memory
  for (const [id, revision] of Object.entries(entry.revisions ?? {})) {
    const previous = memory[id]
    if (
      revision <= 0 ||
      !(id in (entry.screens ?? {})) ||
      previous?.removed ||
      (previous && previous.revision >= revision)
    )
      continue
    if (next === memory) next = { ...memory }
    next[id] = { value: entry.screens![id], revision }
  }
  return next
}

export function restore(
  entry: OverlayEntry,
  memory: ScreenMemory
): OverlayEntry {
  let next = entry
  for (const [id, saved] of Object.entries(memory)) {
    if (!(id in (entry.screens ?? {}))) continue
    if (!saved.removed && saved.revision <= (entry.revisions?.[id] ?? 0))
      continue
    if (next === entry)
      next = {
        ...entry,
        screens: { ...entry.screens },
        revisions: { ...entry.revisions },
      }
    if (saved.removed) {
      delete next.screens![id]
      delete next.revisions![id]
    } else {
      next.screens![id] = saved.value
      next.revisions![id] = saved.revision
    }
  }
  return next
}
