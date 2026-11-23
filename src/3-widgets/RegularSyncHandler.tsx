import type { FC } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { getLoginState } from '@/store/token'
import { refreshData } from '@/4-features/sync'
import { getLastSyncTime, getPersistenceWarning } from '@/store/data'
import { selectIsSyncPending } from '@/store/sync'
import { loadLocalData } from '@/4-features/localData'
import { useAppDispatch, useAppSelector } from '@/store'
import { needSync } from './regularSyncPolicy'

const CHECK_INTERVAL = 5_000

function useConditionalSync() {
  const dispatch = useAppDispatch()
  const isLoggedIn = useAppSelector(getLoginState)
  const lastSync = useAppSelector(getLastSyncTime)
  const isPending = useAppSelector(selectIsSyncPending)

  const trySyncing = useCallback(() => {
    const shouldSync = needSync({
      isOnline: window.navigator.onLine,
      isLoggedIn,
      isPending,
      lastSync,
      isDocumentHidden: document.hidden,
      now: Date.now(),
    })
    // Pull only: a background push would acknowledge the outbox prefix and
    // silently destroy the undo history behind the user's back.
    if (shouldSync) dispatch(refreshData())
  }, [isLoggedIn, isPending, lastSync, dispatch])

  return trySyncing
}

/** Warn on close when durable writes have failed; pending commands normally survive reload. */
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

  const syncRef = useRef(sync)

  useEffect(() => {
    syncRef.current = sync
  }, [sync])

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
