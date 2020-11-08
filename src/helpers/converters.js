import parseDate from 'date-fns/parseISO'
import { formatDate } from './format'

export const convertDatesToMs = item => {
  const copy = Object.assign({}, item)
  if (copy.changed) copy.changed = copy.changed * 1000
  if (copy.created) copy.created = copy.created * 1000
  if (copy.paidTill) copy.paidTill = copy.paidTill * 1000
  if (copy.date) copy.date = +parseDate(copy.date)
  if (copy.startDate) copy.startDate = +parseDate(copy.startDate)
  if (copy.endDate) copy.endDate = +parseDate(copy.endDate)
  return copy
}

export const convertDatesToServerFormat = item => {
  const copy = Object.assign({}, item)
  if (copy.changed) copy.changed = Math.round(copy.changed / 1000)
  if (copy.created) copy.created = Math.round(copy.created / 1000)
  if (copy.paidTill) copy.paidTill = Math.round(copy.paidTill / 1000)
  if (copy.date) copy.date = formatDate(copy.date, 'yyyy-MM-dd')
  if (copy.startDate) copy.startDate = formatDate(copy.startDate, 'yyyy-MM-dd')
  if (copy.endDate) copy.endDate = formatDate(copy.endDate, 'yyyy-MM-dd')
  return copy
}

export const convertToSyncArray = diffObj =>
  Object.values(diffObj).map(item => convertDatesToServerFormat(item))
