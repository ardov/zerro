const syncCursorOverlap = 1000

/**
 * Returns a ZenMoney incremental cursor one second behind the accepted base.
 *
 * The overlap avoids losing entities committed in the same server second as
 * the previous response. Zero remains the full-refresh cursor.
 */
export function getSyncCursor(serverTimestamp: number): number {
  if (!serverTimestamp) return 0
  return Math.max(syncCursorOverlap, serverTimestamp - syncCursorOverlap)
}
