import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RegisterSWOptions } from 'vite-plugin-pwa/types'

const { register, notify, persist, getState } = vi.hoisted(() => ({
  register: vi.fn(),
  notify: vi.fn(),
  persist: vi.fn(),
  getState: vi.fn(),
}))

vi.mock('@/6-shared/localization', () => ({
  i18n: { t: (key: string) => key },
}))
vi.mock('@/6-shared/ui/kit/Toast', () => ({ toast: { add: notify } }))
vi.mock('@/store', () => ({ store: { getState } }))
vi.mock('@/store/data', () => ({ waitForPersistedReplica: persist }))

class Worker extends EventTarget {
  state: ServiceWorkerState = 'installing'
  postMessage = vi.fn()
  change(state: ServiceWorkerState) {
    this.state = state
    this.dispatchEvent(new Event('statechange'))
  }
}

class Registration extends EventTarget {
  active: Worker | null = new Worker()
  installing: Worker | null = null
  waiting: Worker | null = null
  update = vi.fn(async () => this)

  find(worker = new Worker()) {
    this.installing = worker
    this.dispatchEvent(new Event('updatefound'))
    return worker
  }
}

class Container extends EventTarget {
  controller: Worker | null = null
}

let registration: Registration
let container: Container
let callbacks: RegisterSWOptions
let stop: (() => void) | undefined
let check: typeof import('./appUpdates').checkAppUpdates
let reload: ReturnType<typeof vi.spyOn>
let state: {
  data: { persistenceWarning: string | null }
  sync: { status: { kind: string } }
}

const titles = () => notify.mock.calls.map(([options]) => options.title)
const visible = (value: boolean) => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(
    value ? 'visible' : 'hidden'
  )
  document.dispatchEvent(new Event('visibilitychange'))
}

function activate(worker: Worker) {
  registration.installing = null
  registration.waiting = null
  registration.active = worker
  container.controller = worker
  worker.change('activated')
  container.dispatchEvent(new Event('controllerchange'))
}

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.stubEnv('PROD', true)
  vi.stubGlobal('isSecureContext', true)
  vi.clearAllMocks()
  registration = new Registration()
  container = new Container()
  container.controller = registration.active
  vi.stubGlobal('navigator', { serviceWorker: container, onLine: true })
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  state = {
    data: { persistenceWarning: null },
    sync: { status: { kind: 'idle' } },
  }
  getState.mockImplementation(() => state)
  persist.mockResolvedValue(undefined)
  reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {})
  register.mockImplementation((options: RegisterSWOptions) => {
    callbacks = options
    options.onRegisteredSW?.(
      '/service-worker.js',
      registration as unknown as ServiceWorkerRegistration
    )
  })
  const updates = await import('./appUpdates')
  check = updates.checkAppUpdates
  stop = updates.startAppUpdates(register)
})

afterEach(() => {
  stop?.()
  document.body.replaceChildren()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('application updates', () => {
  it.each([
    { name: 'a dev build', prod: false, secure: false, reason: 'development' },
    {
      name: 'an insecure origin',
      prod: true,
      secure: false,
      reason: 'insecureContext',
    },
    {
      name: 'a browser without service workers',
      prod: true,
      secure: true,
      reason: 'unsupportedBrowser',
    },
  ])(
    'explains why updates are unavailable in $name',
    async ({ prod, secure, reason }) => {
      stop?.()
      vi.clearAllMocks()
      vi.stubEnv('PROD', prod)
      vi.stubGlobal('isSecureContext', secure)
      vi.stubGlobal('navigator', { onLine: true })
      const updates = await import('./appUpdates')
      stop = updates.startAppUpdates(register)

      await check()

      expect(titles()).toEqual([`appUpdate.${reason}`])
      expect(register).not.toHaveBeenCalled()
      expect(registration.update).not.toHaveBeenCalled()
      expect(reload).not.toHaveBeenCalled()
    }
  )

  it('reports a manual check with no new version without reloading', async () => {
    await check()
    expect(registration.update).toHaveBeenCalledOnce()
    expect(titles()).toEqual(['appUpdate.checking', 'appUpdate.current'])
    expect(notify.mock.calls[0][0]).toMatchObject({
      id: 'app-update',
      type: 'loading',
      timeout: 0,
    })
    expect(notify.mock.calls[1][0]).toMatchObject({
      id: 'app-update',
      type: 'success',
      timeout: 6000,
    })
    expect(reload).not.toHaveBeenCalled()
  })

  it('checks every 12 hours while visible and keeps no-update results quiet', async () => {
    await vi.advanceTimersByTimeAsync(12 * 60 * 60_000 - 1)
    expect(registration.update).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(registration.update).toHaveBeenCalledOnce()
    expect(notify).not.toHaveBeenCalled()
    visible(false)
    await vi.advanceTimersByTimeAsync(12 * 60 * 60_000)
    expect(registration.update).toHaveBeenCalledOnce()
  })

  it('checks on foreground return after 30 minutes and lets manual checks bypass that cooldown', async () => {
    visible(false)
    await vi.advanceTimersByTimeAsync(29 * 60_000)
    visible(true)
    window.dispatchEvent(new Event('focus'))
    expect(registration.update).not.toHaveBeenCalled()
    visible(false)
    await vi.advanceTimersByTimeAsync(60_000)
    visible(true)
    window.dispatchEvent(new Event('focus'))
    window.dispatchEvent(new Event('pageshow'))
    await vi.advanceTimersByTimeAsync(0)
    expect(registration.update).toHaveBeenCalledOnce()
    await check()
    expect(registration.update).toHaveBeenCalledTimes(2)
  })

  it('joins an ongoing background check and gives the manual caller feedback', async () => {
    let finish!: () => void
    registration.update.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = () => resolve(registration)
        })
    )
    await vi.advanceTimersByTimeAsync(30 * 60_000)
    window.dispatchEvent(new Event('focus'))
    await vi.advanceTimersByTimeAsync(0)
    const request = check()
    expect(titles()).toEqual(['appUpdate.checking'])
    expect(registration.update).toHaveBeenCalledOnce()
    finish()
    await request
    expect(titles()).toEqual(['appUpdate.checking', 'appUpdate.current'])
  })

  it.each(['manual', 'background'])(
    'shows download and install progress for a %s update before one automatic reload',
    async mode => {
      let worker!: Worker
      registration.update.mockImplementationOnce(async () => {
        worker = registration.find()
        return registration
      })
      if (mode === 'manual') await check()
      else await vi.advanceTimersByTimeAsync(12 * 60 * 60_000)
      expect(titles()).toContain('appUpdate.downloading')
      expect(titles()).not.toContain('appUpdate.current')
      worker.change('installed')
      expect(titles().at(-1)).toBe('appUpdate.installing')
      activate(worker)
      callbacks.onNeedReload?.()
      await vi.advanceTimersByTimeAsync(1499)
      expect(reload).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)
      expect(persist).toHaveBeenCalledOnce()
      expect(reload).toHaveBeenCalledOnce()
      callbacks.onNeedReload?.()
      container.dispatchEvent(new Event('controllerchange'))
      await vi.advanceTimersByTimeAsync(5000)
      expect(reload).toHaveBeenCalledOnce()
    }
  )

  it('reports an update discovered by registration itself', () => {
    registration.find()
    expect(titles()).toEqual(['appUpdate.downloading'])
  })

  it('does not treat the first offline installation as an update', async () => {
    registration.active = null
    container.controller = null
    container.dispatchEvent(new Event('controllerchange'))
    const worker = registration.find()
    activate(worker)
    await vi.advanceTimersByTimeAsync(2000)
    expect(notify).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })

  it('defers restarting a hidden app and shows the status on foreground return', async () => {
    const worker = registration.find()
    visible(false)
    activate(worker)
    await vi.advanceTimersByTimeAsync(5000)
    expect(reload).not.toHaveBeenCalled()
    visible(true)
    await vi.advanceTimersByTimeAsync(1500)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('waits for active input, sync, and every queued local write before restarting', async () => {
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()
    activate(registration.find())
    await vi.advanceTimersByTimeAsync(1500)
    expect(reload).not.toHaveBeenCalled()
    expect(titles().at(-1)).toBe('appUpdate.finishing')
    input.blur()
    state.sync.status.kind = 'pushing'
    await vi.advanceTimersByTimeAsync(1000)
    expect(reload).not.toHaveBeenCalled()
    state.sync.status.kind = 'idle'
    let finish!: () => void
    persist.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = () => resolve(undefined)
        })
    )
    await vi.advanceTimersByTimeAsync(1000)
    expect(reload).not.toHaveBeenCalled()
    state.data = { persistenceWarning: null }
    finish()
    await vi.advanceTimersByTimeAsync(0)
    expect(persist).toHaveBeenCalledTimes(2)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('keeps the page open if local persistence fails', async () => {
    state.data.persistenceWarning = 'Disk full'
    activate(registration.find())
    await vi.advanceTimersByTimeAsync(1500)
    expect(titles().at(-1)).toBe('appUpdate.saveFailed')
    expect(reload).not.toHaveBeenCalled()
  })

  it('restarts only once if another manual check arrives while local writes are finishing', async () => {
    let finish!: () => void
    const writing = new Promise<void>(resolve => {
      finish = resolve
    })
    persist.mockReturnValue(writing)
    activate(registration.find())
    await vi.advanceTimersByTimeAsync(1500)
    await check()
    await vi.advanceTimersByTimeAsync(1500)
    finish()
    await vi.advanceTimersByTimeAsync(0)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('restarts after an update activated by another window', async () => {
    const worker = new Worker()
    registration.active = worker
    container.controller = worker
    container.dispatchEvent(new Event('controllerchange'))
    await vi.advanceTimersByTimeAsync(1500)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('reports offline manual checks and keeps offline background checks quiet', async () => {
    vi.stubGlobal('navigator', { serviceWorker: container, onLine: false })
    await vi.advanceTimersByTimeAsync(12 * 60 * 60_000)
    expect(notify).not.toHaveBeenCalled()
    await check()
    expect(titles().at(-1)).toBe('appUpdate.offline')
    expect(registration.update).not.toHaveBeenCalled()
  })

  it('reports a failed check and allows a later retry', async () => {
    registration.update.mockRejectedValueOnce(new Error('Network error'))
    await check()
    expect(titles().at(-1)).toBe('appUpdate.failed')
    await check()
    expect(titles().at(-1)).toBe('appUpdate.current')
  })

  it('retries registration after a failed startup instead of leaving checks permanently unavailable', async () => {
    stop?.()
    const updates = await import('./appUpdates')
    register.mockImplementationOnce((options: RegisterSWOptions) => {
      options.onRegisterError?.(new Error('Offline at startup'))
    })
    stop = updates.startAppUpdates(register)
    await vi.advanceTimersByTimeAsync(0)
    await check()
    expect(titles().at(-1)).toBe('appUpdate.current')
    expect(registration.update).toHaveBeenCalledOnce()
  })

  it('waits until the page returns if it becomes hidden while saving', async () => {
    let finish!: () => void
    persist.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = () => resolve(undefined)
        })
    )
    activate(registration.find())
    await vi.advanceTimersByTimeAsync(1500)
    visible(false)
    finish()
    await vi.advanceTimersByTimeAsync(0)
    expect(reload).not.toHaveBeenCalled()
    visible(true)
    await vi.advanceTimersByTimeAsync(1500)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('ends a stalled manual check with an error instead of an endless spinner', async () => {
    registration.update.mockImplementationOnce(() => new Promise(() => {}))
    const request = check()
    await vi.advanceTimersByTimeAsync(30_000)
    await request
    expect(titles().at(-1)).toBe('appUpdate.failed')
    await check()
    expect(titles().at(-1)).toBe('appUpdate.current')
  })

  it('reports a failed download, allows another check, and never reloads the failed worker', async () => {
    const worker = registration.find()
    worker.change('redundant')
    await vi.advanceTimersByTimeAsync(2000)
    expect(titles().at(-1)).toBe('appUpdate.failed')
    expect(reload).not.toHaveBeenCalled()
    registration.installing = null
    await check()
    expect(registration.update).toHaveBeenCalledOnce()
  })

  it('reports a stalled download and recovers if that worker later activates', async () => {
    const worker = registration.find()
    await vi.advanceTimersByTimeAsync(2 * 60_000)
    expect(titles().at(-1)).toBe('appUpdate.failed')
    activate(worker)
    await vi.advanceTimersByTimeAsync(1500)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('cleans up checks, worker events, and pending restarts on unmount', async () => {
    const worker = registration.find()
    stop?.()
    notify.mockClear()
    activate(worker)
    callbacks.onNeedReload?.()
    visible(true)
    window.dispatchEvent(new Event('focus'))
    await vi.advanceTimersByTimeAsync(24 * 60 * 60_000)
    expect(registration.update).not.toHaveBeenCalled()
    expect(notify).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })
})
