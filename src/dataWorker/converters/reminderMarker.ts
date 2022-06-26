import { TRawReminderMarker, TZmReminderMarker } from 'shared/types'
import {
  toISODate,
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
    }
  },
  toServer: (el: TRawReminderMarker): TZmReminderMarker => {
    return {
      ...el,
      changed: msToUnix(el.changed),
    }
  },
}
