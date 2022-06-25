import { TRawReminderMarker, TZmReminderMarker } from 'shared/types'
import {
  msToISODate,
  msToUnix,
  TZmAdapter,
  zmDateToMs,
} from 'shared/helpers/adapterUtils'

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
