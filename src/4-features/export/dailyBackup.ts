import { isSameDay } from 'date-fns'
import { fakeToken } from '@/6-shared/api/zenmoney/fetchDiff'
import { i18n } from '@/6-shared/localization'
import { toast } from '@/6-shared/ui/kit/Toast'
import type { AppStore, AppThunk, RootState } from '@/store'
import { getRootUserId } from '@/zerro-core/replica'
import {
  getBackupFolder,
  setBackupFolder,
  type BackupDirectory,
  type BackupFolder,
} from './backupFolder'
import { writeDailyBackupFile } from './dailyBackupFile'

type PickerWindow = Window & {
  showDirectoryPicker?: (options: {
    id: string
    mode: 'readwrite'
  }) => Promise<BackupDirectory>
}

function supportsBackupFolders() {
  return (
    typeof (window as PickerWindow).showDirectoryPicker === 'function' &&
    !!navigator.locks &&
    typeof indexedDB !== 'undefined' &&
    typeof BroadcastChannel !== 'undefined'
  )
}

export function selectBackupUser(state: RootState) {
  if (
    !state.token ||
    state.token === fakeToken ||
    state.data.journalRecoveryRequired ||
    !supportsBackupFolders()
  )
    return null
  return getRootUserId(state.data.base.user)
}

function withFolderLock<T>(userId: number, run: () => Promise<T>) {
  // Read the last successful write inside the lock. Other tabs may have
  // already saved today's file, changed folders or turned backups off.
  return navigator.locks.request(`zerro-backup-${userId}`, run)
}

type GetState = () => RootState
type FileProblem = NonNullable<BackupFolder['problem']>

/** Returns file errors. A settings commit can reject after the file is saved. */
async function saveBackup(
  getState: GetState,
  userId: number,
  folder: BackupFolder
): Promise<FileProblem | null> {
  const { directory } = folder
  let savedAt = folder.lastSavedAt
  const now = Date.now()
  const due = savedAt === null || !isSameDay(now, savedAt)
  if (!due && !folder.problem) return null
  let hasPendingChanges: boolean
  try {
    if ((await directory.queryPermission({ mode: 'readwrite' })) !== 'granted')
      return 'access'
    const state = getState()
    if (selectBackupUser(state) !== userId) return null
    hasPendingChanges = state.data.outbox.length > 0
    if (due) {
      savedAt = await writeDailyBackupFile(directory, userId, now, state)
    }
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotFoundError') return 'missing'
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError')
        return 'access'
    }
    return 'write'
  }
  await setBackupFolder(userId, {
    directory,
    lastSavedAt: savedAt,
    problem: null,
  })
  if (due && selectBackupUser(getState()) === userId) {
    toast.add({
      type: 'success',
      title: i18n.t('settings:backupSaved'),
      description: hasPendingChanges
        ? i18n.t('settings:backupSyncedOnly')
        : undefined,
    })
  }
  return null
}

async function saveConfiguredFolder(
  getState: GetState,
  userId: number,
  folder: BackupFolder
) {
  const problem = await saveBackup(getState, userId, folder)
  if (!problem) return
  await setBackupFolder(userId, { ...folder, problem, failedAt: Date.now() })
  if (selectBackupUser(getState()) !== userId) return
  if (problem === 'write') {
    toast.add({
      type: 'error',
      title: i18n.t('settings:backupFailed'),
      description: i18n.t('settings:backupRetryNextDay'),
    })
    return
  }
  toast.add({
    type: 'warning',
    title: i18n.t('settings:backupAccessLost'),
    actionProps:
      problem === 'access'
        ? {
            children: i18n.t('settings:resumeBackupAction'),
            onClick: () =>
              void resumeFolder(getState, userId, folder.directory),
          }
        : undefined,
  })
}

export const chooseBackupFolder =
  (): AppThunk<Promise<void>> => async (_, getState) => {
    const userId = selectBackupUser(getState())
    if (userId === null) return
    try {
      // The picker needs the original click's user activation, before any await.
      const directory = await (window as PickerWindow).showDirectoryPicker!({
        id: 'zerro-backups',
        mode: 'readwrite',
      })
      await withFolderLock(userId, async () => {
        if (selectBackupUser(getState()) !== userId) return
        const problem = await saveBackup(getState, userId, {
          directory,
          lastSavedAt: null,
          problem: null,
        }).catch(() => 'settings')
        if (!problem) return
        const current = await getBackupFolder(userId)
        if (selectBackupUser(getState()) === userId) {
          toast.add({
            type: 'error',
            title: i18n.t('settings:backupFolderSetupFailed'),
            description: current
              ? i18n.t('settings:backupPreviousFolder', {
                  folder: current.directory.name,
                })
              : i18n.t('settings:backupsOff'),
          })
        }
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      if (selectBackupUser(getState()) === userId)
        toast.add({
          type: 'error',
          title: i18n.t('settings:backupFolderSetupFailed'),
        })
    }
  }

export const resumeBackupFolder =
  (directory: BackupDirectory): AppThunk<Promise<void>> =>
  (_, getState) => {
    const userId = selectBackupUser(getState())
    return userId === null
      ? Promise.resolve()
      : resumeFolder(getState, userId, directory)
  }

async function resumeFolder(
  getState: GetState,
  userId: number,
  directory: BackupDirectory
) {
  if (selectBackupUser(getState()) !== userId) return
  try {
    if (
      (await directory.requestPermission({ mode: 'readwrite' })) !== 'granted'
    ) {
      if (selectBackupUser(getState()) === userId)
        toast.add({
          type: 'warning',
          title: i18n.t('settings:backupAccessLost'),
        })
      return
    }
    await withFolderLock(userId, async () => {
      const live = await getBackupFolder(userId)
      if (
        live?.problem === 'access' &&
        (await directory.isSameEntry(live.directory)) &&
        selectBackupUser(getState()) === userId
      )
        await saveConfiguredFolder(getState, userId, live)
    })
  } catch {
    if (selectBackupUser(getState()) === userId)
      toast.add({
        type: 'error',
        title: i18n.t('settings:backupSettingsFailed'),
      })
  }
}

export const disableFolderBackups =
  (): AppThunk<Promise<void>> => async (_, getState) => {
    const userId = selectBackupUser(getState())
    if (userId === null) return
    try {
      await withFolderLock(userId, () => setBackupFolder(userId))
    } catch {
      toast.add({
        type: 'error',
        title: i18n.t('settings:backupDisableFailed'),
      })
    }
  }

export function startDailyBackups(
  store: Pick<AppStore, 'getState' | 'subscribe'>
) {
  if (!supportsBackupFolders()) return
  let previous = store.getState().sync.lastResult
  return store.subscribe(() => {
    const state = store.getState()
    const result = state.sync.lastResult
    if (result === previous) return
    previous = result
    if (!result?.isSuccessful) return
    const userId = selectBackupUser(state)
    if (userId === null) return
    void withFolderLock(userId, async () => {
      const folder = await getBackupFolder(userId)
      if (!folder || selectBackupUser(store.getState()) !== userId) return
      if (folder.problem === 'access' || folder.problem === 'missing') return
      if (
        folder.problem === 'write' &&
        folder.failedAt !== undefined &&
        isSameDay(folder.failedAt, Date.now())
      )
        return
      await saveConfiguredFolder(store.getState, userId, folder)
    }).catch(error => console.warn('Could not access backup settings', error))
  })
}
