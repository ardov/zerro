import { formatDate } from '6-shared/helpers/date'
import type { AppThunk, RootState } from 'store'
import { getDataToSave } from '../shared/getDataToSave'

/** Export always snapshots the last acknowledged server base, never the outbox. */
export function getBackupContent(state: RootState): string {
  return JSON.stringify(getDataToSave(state), null, 2)
}

export const exportJSON: AppThunk = (_, getState) => {
  const state = getState()
  const content = getBackupContent(state)
  const blob = new Blob([content], { type: 'text/json' })
  const href = window.URL.createObjectURL(blob)
  const fileName = `zm-backup-${formatDate(Date.now(), 'yyyyMMdd-HHmm')}.json`

  const link = document.createElement('a')
  link.setAttribute('href', href)
  link.setAttribute('download', fileName)
  document.body.appendChild(link) // Required for FF

  link.click()
}
