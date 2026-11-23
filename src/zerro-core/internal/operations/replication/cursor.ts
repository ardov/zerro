const syncCursorOverlap = 1000

/** Overlap the last server second so same-second changes are fetched. Zero still requests a full refresh. */
export function getSyncCursor(serverTimestamp: number): number {
  if (!serverTimestamp) return 0
  return Math.max(syncCursorOverlap, serverTimestamp - syncCursorOverlap)
}
