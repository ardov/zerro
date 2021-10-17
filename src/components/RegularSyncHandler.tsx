import { FC, useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getLoginState } from 'store/token'
import { syncData } from 'logic/sync'
import { getLastSyncTime } from 'store/data/selectors'
import { getLastChangeTime } from 'store/localData'
import { getPendingState } from 'store/isPending'
import { loadLocalData } from 'logic/localData'
import { createLocalStorageStateHook } from 'use-local-storage-state'

export const useRegularSync = createLocalStorageStateHook<boolean>(
  'regularSync',
  true
)

const SYNC_DELAY = 20 * 60 * 1000 // 20min
const CHECK_DELAY = 20 * 1000 // 20sec

export const RegularSyncHandler: FC<{}> = props => {
  const dispatch = useDispatch()
  const lastChange = useSelector(getLastChangeTime)
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
      timer = setInterval(() => syncRef.current(), CHECK_DELAY)
    }
    init()
    return () => clearInterval(timer)
  }, [dispatch, syncRef])

  // Alert about unsaved changes when user tries to close the window
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (lastChange) {
        window.alert('UNSAVED CHANGES')
        ;(e || window.event).returnValue = null
        return null
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [lastChange])

  return null
}

function useConditionalSync() {
  const dispatch = useDispatch()
  const [regular] = useRegularSync()
  const isLoggedIn = useSelector(getLoginState)
  const lastSync = useSelector(getLastSyncTime)
  const lastChange = useSelector(getLastChangeTime)
  const isPending = useSelector(getPendingState)

  const needSync = useCallback(() => {
    if (!window.navigator.onLine) return false
    if (!isLoggedIn) return false
    if (isPending) return false
    if (!regular) return false
    // Regular sync condition
    const sinceLastSync = Date.now() - lastSync
    const sinceLastChange = Date.now() - lastChange

    if (!document.hidden && sinceLastSync > SYNC_DELAY) {
      return true
    }
    // Sync changes condition
    if (!!lastChange && sinceLastChange > CHECK_DELAY) {
      return true
    }
    return false
  }, [isLoggedIn, isPending, lastChange, lastSync, regular])
  return () => {
    if (needSync()) dispatch(syncData())
  }
}
