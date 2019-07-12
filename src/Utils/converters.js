import parseDate from 'date-fns/parse'
import { format } from 'date-fns'

export const convertDatesToMs = item =>
  Object.keys(item).reduce((obj, key) => {
    switch (key) {
      case 'changed':
      case 'created':
        obj[key] = item[key] * 1000
        break

      case 'date':
      case 'startDate':
      case 'endDate':
        obj[key] = item[key] ? +parseDate(item[key]) : null
        break

      default:
        obj[key] = item[key]
        break
    }
    return obj
  }, {})

export const convertDatesToServerFormat = item =>
  Object.keys(item).reduce((obj, key) => {
    switch (key) {
      case 'changed':
      case 'created':
        obj[key] = +(item[key] / 1000).toFixed(0)
        break

      case 'date':
      case 'startDate':
      case 'endDate':
        obj[key] = item[key] ? format(item[key], 'YYYY-MM-DD') : null
        break

      default:
        obj[key] = item[key]
        break
    }
    return obj
  }, {})

export const convertToSyncArray = diffObj =>
  Object.values(diffObj).map(item => convertDatesToServerFormat(item))

export const convertToClient = arr =>
  arr.reduce((obj, item) => {
    const id = item.id ? item.id : `${item.tag},${item.date}` // if no id it's budget
    obj[id] = convertDatesToMs(item)
    return obj
  }, {})
