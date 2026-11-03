import { openDB, type DBSchema } from 'idb'

export type BackupDirectory = FileSystemDirectoryHandle & {
  requestPermission(options: { mode: 'readwrite' }): Promise<PermissionState>
  queryPermission(options: { mode: 'readwrite' }): Promise<PermissionState>
}

export type BackupFolder = {
  directory: BackupDirectory
  lastSavedAt: number | null
  problem: 'access' | 'missing' | 'write' | null
  failedAt?: number
}

interface BackupDB extends DBSchema {
  folders: { key: number; value: BackupFolder }
}

const channelName = 'zerro-backup-folders'

function openFolders() {
  return openDB<BackupDB>(channelName, 1, {
    upgrade: db => db.createObjectStore('folders'),
  })
}
let database: ReturnType<typeof openFolders> | undefined
function folders() {
  return (database ??= openFolders().catch(error => {
    database = undefined
    throw error
  }))
}

export async function getBackupFolder(userId: number) {
  return (await folders()).get('folders', userId)
}

export async function setBackupFolder(userId: number, folder?: BackupFolder) {
  const db = await folders()
  if (folder) await db.put('folders', folder, userId)
  else await db.delete('folders', userId)

  const channel = new BroadcastChannel(channelName)
  channel.postMessage(userId)
  channel.close()
}

export function watchBackupFolder(userId: number, refresh: () => void) {
  const channel = new BroadcastChannel(channelName)
  channel.onmessage = event => {
    if (event.data === userId) refresh()
  }
  return () => channel.close()
}
