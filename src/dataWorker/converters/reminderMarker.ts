import { TReminderMarker, TZmReminderMarker } from 'shared/types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'

export const convertReminderMarker: TZmAdapter<
  TZmReminderMarker,
  TReminderMarker
> = {
  toClient: (el: TZmReminderMarker): TReminderMarker => {
    return {
      ...el,
      changed: unixToMs(el.changed),
    }
  },
  toServer: (el: TReminderMarker): TZmReminderMarker => {
    return {
      ...el,
      changed: msToUnix(el.changed),
    }
  },
}
