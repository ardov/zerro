/** Delay between syncs if nothing changed. */
const IDLE_SYNC_DELAY = 60_000

type TSyncPolicyInput = {
  isOnline: boolean
  isLoggedIn: boolean
  isPending: boolean
  lastSync: number
  isDocumentHidden: boolean
  now: number
}

/** Decides whether the background handler may start a sync. */
export function needSync({
  isOnline,
  isLoggedIn,
  isPending,
  lastSync,
  isDocumentHidden,
  now,
}: TSyncPolicyInput) {
  if (!isOnline) return false
  if (!isLoggedIn) return false
  if (isPending) return false
  if (lastSync === 0) return true
  if (isDocumentHidden) return false

  return now - lastSync > IDLE_SYNC_DELAY
}
