import type { FC } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { getLoginState } from '@/store/token'
import { refreshData } from '@/4-features/sync'
import { getLastSyncTime, getPersistenceWarning } from '@/store/data'
import { selectIsSyncPending } from '@/store/sync'
import { loadLocalData } from '@/4-features/localData'
import useLocalStorageState from 'use-local-storage-state'
import { useAppDispatch, useAppSelector } from '@/store'
import { needSync } from './regularSyncPolicy'

/** Local storage hook for regular sync setting */
export const useRegularSync = () =>
  useLocalStorageState<boolean>('regularSync', {
    defaultValue: true,
  })

/** Delay between checks if sync is needed */
const CHECK_INTERVAL = 5_000 // 5sec

function useConditionalSync() {
  const dispatch = useAppDispatch()
  const [regular] = useRegularSync()
  const isLoggedIn = useAppSelector(getLoginState)
  const lastSync = useAppSelector(getLastSyncTime)
  const isPending = useAppSelector(selectIsSyncPending)

  const trySyncing = useCallback(() => {
    const shouldSync = needSync({
      isOnline: window.navigator.onLine,
      isLoggedIn,
      isPending,
      lastSync,
      regular,
      isDocumentHidden: document.hidden,
      now: Date.now(),
    })
    // Pull only: a background push would acknowledge the outbox prefix and
    // silently destroy the undo history behind the user's back.
    if (shouldSync) dispatch(refreshData())
  }, [isLoggedIn, isPending, lastSync, regular, dispatch])

  return trySyncing
}

/**
 * Asks before closing only when local saving has failed. Unsent changes alone
 * are no reason: they are already stored locally and come back after reload.
 * After a failure local storage is frozen at that moment, so anything since
 * then lives only in this tab.
 */
function usePersistenceFailureAlert() {
  const persistenceFailed = useAppSelector(getPersistenceWarning) !== null
  useEffect(() => {
    if (!persistenceFailed) return
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = true
      return true
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [persistenceFailed])
}

export const RegularSyncHandler: FC = () => {
  usePersistenceFailureAlert()
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
    let timer: ReturnType<typeof setInterval>
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
