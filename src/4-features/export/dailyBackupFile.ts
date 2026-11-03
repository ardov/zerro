import { isSameDay } from 'date-fns'
import { parseFullBackup } from '@/6-shared/api/zm-adapter'
import { formatDate } from '@/6-shared/helpers/date'
import type { RootState } from '@/store'
import { getRootUserId } from '@/zerro-core/replica'
import { getBackupContent } from './exportJSON'

export async function writeDailyBackupFile(
  directory: FileSystemDirectoryHandle,
  userId: number,
  now: number,
  state: RootState
) {
  const name = `zm-backup-${userId}-${formatDate(now, 'yyyy-MM-dd')}.json`
  let handle: FileSystemFileHandle
  let created = false
  try {
    handle = await directory.getFileHandle(name)
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'NotFoundError'))
      throw error
    handle = await directory.getFileHandle(name, { create: true })
    created = true
  }

  let stream: FileSystemWritableFileStream | undefined
  try {
    const file = await handle.getFile()
    if (file.size > 0) {
      // A previous run may have closed the file but failed to commit IndexedDB.
      const backup = parseFullBackup(await file.text())
      if (!backup.ok || getRootUserId(backup.store.user) !== userId)
        throw new Error('Daily backup filename is already in use')
      return isSameDay(file.lastModified, now) ? file.lastModified : now
    }
    const content = getBackupContent(state)
    stream = await handle.createWritable()
    await stream.write(content)
    await stream.close()
    return now
  } catch (error) {
    await stream?.abort().catch(() => {})
    if (created) {
      try {
        const current = await directory.getFileHandle(name)
        if (
          (await current.isSameEntry(handle)) &&
          (await current.getFile()).size === 0
        )
          await directory.removeEntry(name)
      } catch {
        // Cleanup can lose access too. Report the original write error.
      }
    }
    throw error
  }
}
