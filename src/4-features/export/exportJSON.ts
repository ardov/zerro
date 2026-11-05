import { getRootUserId } from '@/zerro-core/replica'
import { formatDate } from '@/6-shared/helpers/date'
import type { AppThunk, RootState } from '@/store'
import { getDataToSave } from '../shared/getDataToSave'

/** Export always snapshots the last acknowledged server base, never the outbox. */
export function getBackupContent(state: RootState): string {
  return JSON.stringify(getDataToSave(state), null, 2)
}

function getBackupFilename(userId: number | null, date: number) {
  const owner = userId === null ? '' : `-${userId}`
  return `zm-backup${owner}-${formatDate(date, 'yyyy-MM-dd-HHmmss-SSS')}.json`
}

export const exportJSON: AppThunk = (_, getState) => {
  const state = getState()
  const content = getBackupContent(state)
  const blob = new Blob([content], { type: 'text/json' })
  const href = window.URL.createObjectURL(blob)
  const fileName = getBackupFilename(
    getRootUserId(state.data.base.user),
    Date.now()
  )

  const link = document.createElement('a')
  link.setAttribute('href', href)
  link.setAttribute('download', fileName)
  document.body.appendChild(link) // Required for FF

  link.click()
}
