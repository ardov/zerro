import { TRawReminderMarker, TZmReminderMarker } from 'types'
import { msToISODate, msToUnix, TZmAdapter, zmDateToMs } from './utils'

export const convertReminderMarker: TZmAdapter<
  TZmReminderMarker,
  TRawReminderMarker
> = {
  toClient: (el: TZmReminderMarker): TRawReminderMarker => {
    return {
      ...el,
      changed: zmDateToMs(el.changed),
      date: zmDateToMs(el.date),
    }
  },
  toServer: (el: TRawReminderMarker): TZmReminderMarker => {
    return {
      ...el,
      changed: msToUnix(el.changed),
      date: msToISODate(el.date),
    }
  },
}
