import { formatDate } from 'shared/helpers/date'
import { AppThunk } from 'models'
import { getDataToSave } from 'models/data/selectors'

export const exportJSON: AppThunk = (_, getState) => {
  const state = getState()
  const data = getDataToSave(state)
  const content = JSON.stringify(data, null, 2)
  const blob = new Blob([content], { type: 'text/json' })
  const href = window.URL.createObjectURL(blob)
  const fileName = `zm-backup-${formatDate(Date.now(), 'yyyyMMdd-HHmm')}.json`

  var link = document.createElement('a')
  link.setAttribute('href', href)
  link.setAttribute('download', fileName)
  document.body.appendChild(link) // Required for FF

  link.click()
}
