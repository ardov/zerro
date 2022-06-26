import { TRawReminderMarker, TZmReminderMarker } from 'shared/types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'

export const convertReminderMarker: TZmAdapter<
  TZmReminderMarker,
  TRawReminderMarker
> = {
  toClient: (el: TZmReminderMarker): TRawReminderMarker => {
    return {
      ...el,
      changed: unixToMs(el.changed),
    }
  },
  toServer: (el: TRawReminderMarker): TZmReminderMarker => {
    return {
      ...el,
      changed: msToUnix(el.changed),
    }
  },
}
