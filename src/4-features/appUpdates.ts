import type { registerSW } from 'virtual:pwa-register'
import { i18n } from '@/6-shared/localization'
import { toast } from '@/6-shared/ui/kit/Toast'
import { store } from '@/store'
import { waitForPersistedReplica } from '@/store/data'

const CHECK_INTERVAL = 12 * 60 * 60_000
const FOREGROUND_INTERVAL = 30 * 60_000
const REQUEST_TIMEOUT = 30_000
const DOWNLOAD_TIMEOUT = 2 * 60_000
const RELOAD_DELAY = 1_500

type UnavailableReason =
  'development' | 'insecureContext' | 'unsupportedBrowser'

type Status =
  | 'checking'
  | 'current'
  | 'downloading'
  | 'installing'
  | 'finishing'
  | 'reloading'
  | 'offline'
  | 'unavailable'
  | 'failed'
  | 'saveFailed'
  | UnavailableReason

function notify(status: Status) {
  const loading = [
    'checking',
    'downloading',
    'installing',
    'finishing',
    'reloading',
  ].includes(status)
  toast.add({
    id: 'app-update',
    title: i18n.t(`appUpdate.${status}`, { ns: 'settings' }),
    type: loading ? 'loading' : status === 'current' ? 'success' : 'error',
    timeout: loading ? 0 : 6000,
  })
}

let updater: ReturnType<typeof createUpdater> | undefined

function getUnavailableReason(): UnavailableReason | undefined {
  if (!import.meta.env.PROD) return 'development'
  if (!window.isSecureContext) return 'insecureContext'
  if (!('serviceWorker' in navigator)) return 'unsupportedBrowser'
}

/** Start after the global Toaster mounts. Registration itself checks at startup. */
export function startAppUpdates(register: typeof registerSW) {
  if (getUnavailableReason()) return
  if (updater) return
  const current = createUpdater(register)
  updater = current
  return () => {
    current.stop()
    if (updater === current) updater = undefined
  }
}

export function checkAppUpdates(): Promise<void> {
  const reason = getUnavailableReason()
  if (reason || !updater) {
    notify(reason ?? 'unavailable')
    return Promise.resolve()
  }
  return updater.check(true)
}

function createUpdater(register: typeof registerSW) {
  const container = navigator.serviceWorker
  let controller = container.controller
  let registration: ServiceWorkerRegistration | undefined
  let registrationPromise: Promise<ServiceWorkerRegistration> | undefined
  let registrationAttempt = 0
  let stopped = false
  let lastCheck = Date.now()
  let inFlight: Promise<void> | undefined
  let manualCheck = false
  let phase: Status | undefined
  let candidate: ServiceWorker | undefined
  let pendingReload = false
  let reloading = false
  let reloadTimer: ReturnType<typeof setTimeout> | undefined
  let downloadTimer: ReturnType<typeof setTimeout> | undefined
  const watched = new Map<ServiceWorker, () => void>()

  function show(status: Status) {
    if (stopped) return
    if (phase !== status) notify(status)
    phase = status
  }

  function updateReady() {
    if (stopped || pendingReload) return
    clearTimeout(downloadTimer)
    pendingReload = true
    show('installing')
    scheduleReload(RELOAD_DELAY)
  }

  function scheduleReload(delay: number) {
    clearTimeout(reloadTimer)
    reloadTimer = setTimeout(() => void reloadWhenSafe(), delay)
  }

  async function reloadWhenSafe() {
    if (stopped || reloading || document.visibilityState !== 'visible') return
    if (!canRestart()) {
      show('finishing')
      scheduleReload(1000)
      return
    }
    try {
      // New commands can join the persistence queue while an earlier write is
      // settling. Wait for a stable replica, then reload in the same JS turn.
      let before
      do {
        before = store.getState().data
        await waitForPersistedReplica()
      } while (!stopped && before !== store.getState().data)
      if (stopped || reloading) return
      if (store.getState().data.persistenceWarning) {
        show('saveFailed')
        return
      }
      if (!canRestart() || document.visibilityState !== 'visible') {
        scheduleReload(1000)
        return
      }
      reloading = true
      show('reloading')
      window.location.reload()
    } catch {
      show('saveFailed')
    }
  }

  function canRestart() {
    return (
      !!container.controller &&
      registration?.active === container.controller &&
      canReload()
    )
  }

  function watch(worker: ServiceWorker) {
    candidate = worker
    const listener = watched.get(worker)
    if (listener) {
      listener()
      return
    }
    const changed = () => {
      if (stopped || candidate !== worker) return
      switch (worker.state) {
        case 'installing':
          show('downloading')
          clearTimeout(downloadTimer)
          downloadTimer = setTimeout(() => {
            candidate = undefined
            show('failed')
          }, DOWNLOAD_TIMEOUT)
          break
        case 'installed':
        case 'activating':
          show('installing')
          break
        case 'activated':
          updateReady()
          break
        case 'redundant':
          clearTimeout(downloadTimer)
          candidate = undefined
          if (!pendingReload) show('failed')
          break
      }
    }
    worker.addEventListener('statechange', changed)
    watched.set(worker, changed)
    changed()
  }

  function updateFound() {
    // The first offline installation is not a new application version.
    if (registration?.installing && (registration.active || controller)) {
      watch(registration.installing)
    }
  }

  function controllerChanged() {
    const previous = controller
    controller = container.controller
    // Also cover an update activated by another window of the same PWA.
    if (previous && controller && previous !== controller) updateReady()
  }

  async function performCheck() {
    try {
      const registered = await withTimeout(ensureRegistration())
      if (stopped) return
      await withTimeout(registered.update())
      if (stopped) return
      updateFound()
      if (manualCheck && phase === 'checking') show('current')
    } catch {
      if (!registration) registrationPromise = undefined
      if (manualCheck && !candidate && !pendingReload) show('failed')
    } finally {
      inFlight = undefined
      manualCheck = false
    }
  }

  function check(manual = false): Promise<void> {
    if (stopped) return Promise.resolve()
    if (pendingReload || candidate) {
      if (manual && phase) notify(phase)
      if (pendingReload && !reloading) scheduleReload(RELOAD_DELAY)
      return Promise.resolve()
    }
    if (manual) {
      manualCheck = true
      notify('checking')
      phase = 'checking'
    }
    if (inFlight) return inFlight
    if (!navigator.onLine) {
      if (manual) show('offline')
      manualCheck = false
      return Promise.resolve()
    }
    lastCheck = Date.now()
    // Keep background checks quiet until an update is actually found.
    phase = 'checking'
    inFlight = performCheck()
    return inFlight
  }

  function foreground() {
    if (document.visibilityState !== 'visible') return
    if (pendingReload) scheduleReload(RELOAD_DELAY)
    else if (Date.now() - lastCheck >= FOREGROUND_INTERVAL) void check()
  }

  container.addEventListener('controllerchange', controllerChanged)
  document.addEventListener('visibilitychange', foreground)
  window.addEventListener('focus', foreground)
  window.addEventListener('pageshow', foreground)
  window.addEventListener('online', foreground)
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') void check()
  }, CHECK_INTERVAL)

  function ensureRegistration(): Promise<ServiceWorkerRegistration> {
    if (registrationPromise) return registrationPromise
    const attempt = ++registrationAttempt
    registrationPromise = new Promise((resolve, reject) => {
      register({
        immediate: true,
        onRegisteredSW(_url, registered) {
          if (stopped || attempt !== registrationAttempt) return
          if (!registered) {
            reject(new Error('No service worker registration'))
            return
          }
          registration = registered
          registration.addEventListener('updatefound', updateFound)
          updateFound()
          if (registration.waiting) {
            watch(registration.waiting)
            registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          }
          resolve(registration)
        },
        onNeedReload() {
          if (attempt === registrationAttempt) updateReady()
        },
        onRegisterError: reject,
      })
    })
    return registrationPromise
  }
  void ensureRegistration().catch(() => {
    registrationPromise = undefined
  })

  return {
    check,
    stop() {
      stopped = true
      clearInterval(interval)
      clearTimeout(reloadTimer)
      clearTimeout(downloadTimer)
      registration?.removeEventListener('updatefound', updateFound)
      container.removeEventListener('controllerchange', controllerChanged)
      document.removeEventListener('visibilitychange', foreground)
      window.removeEventListener('focus', foreground)
      window.removeEventListener('pageshow', foreground)
      window.removeEventListener('online', foreground)
      for (const [worker, listener] of watched) {
        worker.removeEventListener('statechange', listener)
      }
    },
  }
}

function canReload() {
  const kind = store.getState().sync.status.kind
  if (kind === 'pulling' || kind === 'pushing') return false
  const active = document.activeElement
  return !active?.matches(
    'input, textarea, [contenteditable="true"], [role="textbox"]'
  )
}

async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error('Update check timed out')),
          REQUEST_TIMEOUT
        )
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
