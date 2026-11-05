import { configureStore } from '@reduxjs/toolkit'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AccountType } from '@/6-shared/types'
import { fakeToken } from '@/6-shared/api/zenmoney/fetchDiff'
import { i18n } from '@/6-shared/localization'
import { toast } from '@/6-shared/ui/kit/Toast'
import { rootReducer } from '@/store/rootReducer'
import { syncFinished } from '@/store/sync'
import { makeTestRootState } from '@/store/testing'
import { setToken } from '@/store/token'
import {
  makeAccount,
  makeInstrument,
  makeStore,
  makeUser,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import {
  getBackupFolder,
  setBackupFolder,
  type BackupFolder,
} from './backupFolder'
import {
  chooseBackupFolder,
  disableFolderBackups,
  resumeBackupFolder,
  selectBackupUser,
  startDailyBackups,
} from './dailyBackup'

vi.mock('./backupFolder', () => ({
  getBackupFolder: vi.fn(),
  setBackupFolder: vi.fn(),
}))
vi.mock('@/6-shared/ui/kit/Toast', () => ({ toast: { add: vi.fn() } }))

const pick = vi.fn()
function makeDirectory(name: string) {
  const files = new Map<string, File>()
  const queryPermission = vi
    .fn<() => Promise<PermissionState>>()
    .mockResolvedValue('granted')
  const write = vi.fn<(content: string) => Promise<void>>()
  const close = vi.fn<() => Promise<void>>()
  const directory = {
    name,
    files,
    write,
    close,
    queryPermission,
    requestPermission: vi.fn(async () => 'granted'),
    isSameEntry: async (other: unknown) => other === directory,
    removeEntry: async (name: string) => {
      files.delete(name)
    },
    getFileHandle: async (name: string, options?: { create?: boolean }) => {
      if (!files.has(name)) {
        if (!options?.create)
          throw new DOMException('Missing file', 'NotFoundError')
        files.set(name, new File([], name))
      }
      return {
        name,
        getFile: async () => files.get(name)!,
        isSameEntry: async (other: FileSystemFileHandle) => other.name === name,
        createWritable: async () => {
          let staged = ''
          return {
            write: async (content: string) => {
              await write(content)
              staged = content
            },
            close: async () => {
              await close()
              files.set(
                name,
                new File([staged], name, { lastModified: Date.now() })
              )
            },
            abort: async () => {},
          }
        },
      }
    },
  }
  return directory
}
let directory: ReturnType<typeof makeDirectory>
let pending: Promise<unknown>
const records = new Map<number, BackupFolder>()

beforeEach(() => {
  vi.clearAllMocks()
  directory = makeDirectory('Original')
  vi.setSystemTime(new Date(2026, 10, 3, 20))
  records.clear()
  pending = Promise.resolve()
  vi.stubGlobal('indexedDB', {})
  vi.stubGlobal('BroadcastChannel', class {})
  vi.stubGlobal('navigator', {
    locks: {
      request: (_name: string, run: () => Promise<void>) => {
        const next = pending.then(run)
        pending = next.catch(() => {})
        return next
      },
    },
  })
  vi.stubGlobal('showDirectoryPicker', pick.mockResolvedValue(directory))
  vi.mocked(getBackupFolder).mockImplementation(async id => records.get(id))
  vi.mocked(setBackupFolder).mockImplementation(async (id, config) => {
    if (config) records.set(id, config)
    else records.delete(id)
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function app(userId: number, token = 'test-account') {
  const base = makeStore({
    country: {
      1: { id: 1, title: 'United States', currency: 1, domain: 'us' },
    },
    instrument: { 1: makeInstrument({ id: 1 }) },
    account: {
      debt: makeAccount({
        id: 'debt',
        user: userId,
        type: AccountType.Debt,
        title: 'Debt',
      }),
    },
    user: { [userId]: makeUser({ id: userId, parent: null, currency: 1 }) },
  })
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: makeTestRootState(base, { token }),
  })
  startDailyBackups(store)
  return {
    store,
    sync(success = true) {
      store.dispatch(
        syncFinished({
          isSuccessful: success,
          finishedAt: Date.now(),
          errorMessage: success ? null : 'offline',
        })
      )
      return pending
    },
  }
}

it('saves immediately, then once per local day after successful sync, across tabs and restarts', async () => {
  const first = app(42)
  await first.store.dispatch(chooseBackupFolder())
  const firstFile = directory.files.get('zm-backup-42-2026-11-03.json')!
  expect(JSON.parse(await firstFile.text()).user[0].id).toBe(42)
  const second = app(42)
  await second.sync()
  vi.setSystemTime(new Date(2026, 10, 4, 1))
  await second.sync(false)
  expect(directory.files.size).toBe(1)
  await Promise.all([first.sync(), second.sync()])
  expect(Array.from(directory.files.keys())).toEqual([
    firstFile.name,
    'zm-backup-42-2026-11-04.json',
  ])
  expect(toast.add).toHaveBeenCalledTimes(2)
  await first.store.dispatch(disableFolderBackups())
  vi.setSystemTime(new Date(2026, 10, 5, 8))
  await second.sync()
  expect(directory.files.size).toBe(2)
})

it('checks lost access when the next backup is due and resumes from a click', async () => {
  const { store, sync } = app(42)
  await store.dispatch(chooseBackupFolder())
  const lastSavedAt = records.get(42)?.lastSavedAt
  directory.queryPermission.mockResolvedValue('prompt')
  await sync()
  expect(records.get(42)?.problem).toBeNull()
  expect(toast.add).toHaveBeenCalledTimes(1)
  vi.setSystemTime(new Date(2026, 10, 4, 8))
  await sync()
  await sync()
  expect(records.get(42)).toMatchObject({ problem: 'access', lastSavedAt })
  expect(toast.add).toHaveBeenCalledTimes(2)
  expect(toast.add).toHaveBeenLastCalledWith(
    expect.objectContaining({
      type: 'warning',
      actionProps: expect.objectContaining({ onClick: expect.any(Function) }),
    })
  )
  expect(pick).toHaveBeenCalledTimes(1)
  pick.mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError'))
  await store.dispatch(chooseBackupFolder())
  expect(records.get(42)?.problem).toBe('access')
  expect(toast.add).toHaveBeenCalledTimes(2)
  directory.queryPermission.mockResolvedValue('granted')
  await store.dispatch(resumeBackupFolder(records.get(42)!.directory))
  expect(directory.requestPermission).toHaveBeenCalledWith({
    mode: 'readwrite',
  })
  expect(records.get(42)?.problem).toBeNull()
  expect(directory.files.has('zm-backup-42-2026-11-04.json')).toBe(true)
  await sync()
  expect(toast.add).toHaveBeenCalledTimes(3)
})

it.each(['write', 'close'] as const)(
  'cleans up a new file after a failed %s and retries the next local day',
  async step => {
    const { store, sync } = app(42)
    await store.dispatch(chooseBackupFolder())
    const oldFile = 'zm-backup-42-2026-11-03.json'
    const lastSavedAt = records.get(42)?.lastSavedAt
    vi.setSystemTime(new Date(2026, 10, 4, 8))
    directory[step].mockRejectedValueOnce(
      new DOMException('Disk full', 'QuotaExceededError')
    )
    await sync()
    expect(Array.from(directory.files.keys())).toEqual([oldFile])
    expect(records.get(42)).toMatchObject({ problem: 'write', lastSavedAt })
    await sync()
    expect(toast.add).toHaveBeenCalledTimes(2)
    vi.setSystemTime(new Date(2026, 10, 5, 8))
    await sync()
    expect(Array.from(directory.files.keys())).toEqual([
      oldFile,
      'zm-backup-42-2026-11-05.json',
    ])
    expect(records.get(42)).toMatchObject({
      problem: null,
      lastSavedAt: Date.now(),
    })
  }
)

it('recovers a committed file after IndexedDB fails, without rewriting it', async () => {
  const { store, sync } = app(42)
  await store.dispatch(chooseBackupFolder())
  const savedAt = new Date(2026, 10, 4, 9).getTime()
  vi.setSystemTime(savedAt)
  vi.mocked(setBackupFolder).mockRejectedValueOnce(
    new DOMException('Storage full', 'QuotaExceededError')
  )
  await sync()
  vi.setSystemTime(savedAt + 60_000)
  const restarted = app(42)
  await restarted.sync()
  expect(directory.files.size).toBe(2)
  expect(directory.close).toHaveBeenCalledTimes(2)
  expect(records.get(42)?.lastSavedAt).toBe(savedAt)
})

it('repairs an empty daily file left by an interrupted run, but preserves it if the retry fails', async () => {
  const { store } = app(42)
  const name = 'zm-backup-42-2026-11-03.json'
  directory.files.set(name, new File([], name))
  directory.write.mockRejectedValueOnce(new Error('Interrupted'))
  await store.dispatch(chooseBackupFolder())
  expect(directory.files.get(name)?.size).toBe(0)
  expect(records.has(42)).toBe(false)
  await store.dispatch(chooseBackupFolder())
  expect(directory.files.get(name)!.size).toBeGreaterThan(0)
  expect(directory.files.size).toBe(1)
})

it('preserves a nonempty unrelated file at the daily path', async () => {
  const { store } = app(42)
  const name = 'zm-backup-42-2026-11-03.json'
  const file = new File(['another document'], name)
  directory.files.set(name, file)
  await store.dispatch(chooseBackupFolder())
  expect(directory.files.get(name)).toBe(file)
  expect(directory.write).not.toHaveBeenCalled()
  expect(records.size).toBe(0)
})

it.each(['file', 'settings'] as const)(
  'keeps the previous folder when its replacement fails at the %s step',
  async step => {
    const { store, sync } = app(42)
    await store.dispatch(chooseBackupFolder())
    const original = records.get(42)
    const replacement = makeDirectory('Replacement')
    pick.mockResolvedValue(replacement)
    if (step === 'file')
      replacement.close.mockRejectedValueOnce(new Error('Disk full'))
    else
      vi.mocked(setBackupFolder).mockRejectedValueOnce(
        new DOMException('Settings commit failed', 'AbortError')
      )
    await store.dispatch(chooseBackupFolder())
    expect(records.get(42)).toBe(original)
    expect(toast.add).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: i18n.t('settings:backupFolderSetupFailed'),
        description: expect.stringContaining('Original'),
      })
    )
    expect(replacement.files.size).toBe(step === 'file' ? 0 : 1)
    vi.setSystemTime(new Date(2026, 10, 4, 8))
    await sync()
    expect(directory.files.size).toBe(2)
    vi.mocked(setBackupFolder).mockClear()
    await store.dispatch(chooseBackupFolder())
    expect(setBackupFolder).toHaveBeenCalledTimes(1)
    expect(records.get(42)?.directory).toBe(replacement)
  }
)

it('isolates accounts and excludes demo sessions even if they share a root user ID', async () => {
  const { store } = app(42)
  await store.dispatch(chooseBackupFolder())
  const other = app(43)
  await other.sync()
  const demo = app(42, fakeToken)
  expect(selectBackupUser(demo.store.getState())).toBeNull()
  await demo.store.dispatch(chooseBackupFolder())
  await demo.sync()
  expect(pick).toHaveBeenCalledTimes(1)
  expect(directory.write).toHaveBeenCalledTimes(1)
  const choosing = other.store.dispatch(chooseBackupFolder())
  other.store.dispatch(setToken(null))
  await choosing
  expect(records.has(43)).toBe(false)
  vi.stubGlobal('showDirectoryPicker', undefined)
  expect(selectBackupUser(store.getState())).toBeNull()
})
