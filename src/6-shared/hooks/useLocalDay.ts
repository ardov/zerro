import { useSyncExternalStore } from 'react'

function getSnapshot() {
  return new Date().setHours(0, 0, 0, 0)
}

function subscribe(notify: () => void) {
  let timer: ReturnType<typeof setTimeout>
  const refresh = () => {
    clearTimeout(timer)
    notify()
    const tomorrow = new Date()
    tomorrow.setHours(24, 0, 0, 0)
    timer = setTimeout(refresh, tomorrow.getTime() - Date.now())
  }
  refresh()
  // Background tabs can suspend timers; refresh as soon as the user returns.
  document.addEventListener('visibilitychange', refresh)
  window.addEventListener('focus', refresh)
  return () => {
    clearTimeout(timer)
    document.removeEventListener('visibilitychange', refresh)
    window.removeEventListener('focus', refresh)
  }
}

/** Local midnight, shared by relative date labels and calendar-day queries. */
export function useLocalDay() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
