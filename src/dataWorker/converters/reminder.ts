import { TRawReminder, TZmReminder } from 'shared/types'
import {
  toISODate,
  msToUnix,
  TZmAdapter,
  zmDateToMs,
} from 'shared/helpers/adapterUtils'

export const convertReminder: TZmAdapter<TZmReminder, TRawReminder> = {
  toClient: (el: TZmReminder): TRawReminder => ({
    ...el,
    changed: zmDateToMs(el.changed),
  }),
  toServer: (el: TRawReminder): TZmReminder => ({
    ...el,
    changed: msToUnix(el.changed),
  }),
}
