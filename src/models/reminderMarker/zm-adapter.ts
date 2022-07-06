import { IReminderMarker, IZmReminderMarker } from 'shared/types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'

export const convertReminderMarker: TZmAdapter<
  IZmReminderMarker,
  IReminderMarker
> = {
  toClient: (el: IZmReminderMarker): IReminderMarker => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: (el: IReminderMarker): IZmReminderMarker => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}
