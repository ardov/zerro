import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store'
import {
  getBackupFolder,
  watchBackupFolder,
  type BackupFolder,
} from './backupFolder'
import { selectBackupUser } from './dailyBackup'

/** The saved folder of a user: `null` when backups are off, `undefined`
 * until it is read or when it cannot be read. Follows changes from every tab. */
export function useBackupFolder(userId: number | null) {
  const [read, setRead] = useState<{
    userId: number
    folder: BackupFolder | null | undefined
  }>()

  useEffect(() => {
    if (userId === null) return
    const id = userId
    let active = true
    async function refresh() {
      let folder: BackupFolder | null | undefined
      try {
        folder = (await getBackupFolder(id)) ?? null
      } catch {
        folder = undefined
      }
      if (active) setRead({ userId: id, folder })
    }
    const stop = watchBackupFolder(id, refresh)
    void refresh()
    return () => {
      active = false
      stop()
    }
  }, [userId])

  return read?.userId === userId ? read.folder : undefined
}

/** The settings string that names what keeps backups from saving. */
export function backupProblemKey(
  problem: NonNullable<BackupFolder['problem']>
) {
  return problem === 'write' ? 'backupFailed' : 'folderBackupsPaused'
}

/** What keeps automatic backups from saving, in words, if anything does. */
export function useBackupProblem() {
  const { t } = useTranslation('settings')
  const problem = useBackupFolder(useAppSelector(selectBackupUser))?.problem
  return problem ? t(backupProblemKey(problem)) : undefined
}
