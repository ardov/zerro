import { FC, useCallback, useEffect, useRef } from 'react'
import { getLoginState } from 'store/token'
import { syncData } from '4-features/sync'
import { getLastSyncTime, getLastChangeTime } from 'store/data'
import { getPendingState } from 'store/isPending'
import { loadLocalData } from '4-features/localData'
import useLocalStorageState from 'use-local-storage-state'
import { useAppDispatch, useAppSelector } from 'store'

/** Local storage hook for regular sync setting */
export const useRegularSync = () =>
  useLocalStorageState<boolean>('regularSync', {
    defaultValue: true,
  })

/** Delay between checks if sync is needed */
const CHECK_INTERVAL = 5_000 // 5sec
/** Delay between syncs if nothing changed */
const IDLE_SYNC_DELAY = 120_000 // 2min
/** Delay between syncs if there are changes */
const CHANGES_SYNC_DELAY = 20_000 // 20sec

/**
 * Decides whether to sync data
 * @param isLoggedIn - whether user is logged in
 * @param isPending - whether sync is pending
 * @param lastSync - last sync time (0 if never synced)
 * @param lastChange - last change time (0 if no changes)
 * @param regular - whether regular sync is enabled
 * @returns true if sync is needed
 */
function needSync(
  isLoggedIn: boolean,
  isPending: boolean,
  lastSync: number,
  lastChange: number,
  regular: boolean
) {
  if (!window.navigator.onLine) return false
  if (!isLoggedIn) return false
  if (isPending) return false
  if (lastSync === 0) return true // Initial sync is always needed
  if (!regular) return false // All other syncs respect the regular setting

  const sinceLastSync = Date.now() - lastSync
  const sinceLastChange = Date.now() - lastChange

  // Has changes
  if (lastChange !== 0) return sinceLastChange > CHANGES_SYNC_DELAY

  // Disable regular sync when window is hidden
  if (document.hidden) return false

  // Regular periodic sync
  return sinceLastSync > IDLE_SYNC_DELAY
}

function useConditionalSync() {
  const dispatch = useAppDispatch()
  const [regular] = useRegularSync()
  const isLoggedIn = useAppSelector(getLoginState)
  const lastSync = useAppSelector(getLastSyncTime)
  const lastChange = useAppSelector(getLastChangeTime)
  const isPending = useAppSelector(getPendingState)

  const trySyncing = useCallback(() => {
    const shouldSync = needSync(
      isLoggedIn,
      isPending,
      lastSync,
      lastChange,
      regular
    )
    if (shouldSync) dispatch(syncData())
  }, [isLoggedIn, isPending, lastSync, lastChange, regular, dispatch])

  return trySyncing
}

/** Alert about unsaved changes when user tries to close the window */
function useUnsavedChangesAlert() {
  const lastChange = useAppSelector(getLastChangeTime)
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (lastChange) {
        e.preventDefault()
        e.returnValue = true
        return true
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [lastChange])
}

export const RegularSyncHandler: FC<{}> = props => {
  useUnsavedChangesAlert()
  const dispatch = useAppDispatch()
  const sync = useConditionalSync()

  // We need ref to pass useEffect equality checks
  const syncRef = useRef(sync)

  // Keep ref updated
  useEffect(() => {
    syncRef.current = sync
  }, [sync])

  // Main initializer. At first it loads local data and then starts regular sync process
  useEffect(() => {
    let timer: NodeJS.Timeout
    async function init() {
      await dispatch(loadLocalData())
      syncRef.current()
      timer = setInterval(() => syncRef.current(), CHECK_INTERVAL)
    }
    init()
    return () => clearInterval(timer)
  }, [dispatch, syncRef])

  return null
}
