import { TRawReminder, TZmReminder } from 'types'
import { msToISODate, msToUnix, TZmAdapter, zmDateToMs } from './utils'

export const convertReminder: TZmAdapter<TZmReminder, TRawReminder> = {
  toClient: (el: TZmReminder): TRawReminder => ({
    ...el,
    changed: zmDateToMs(el.changed),
    startDate: zmDateToMs(el.startDate),
    endDate: zmDateToMs(el.endDate),
  }),
  toServer: (el: TRawReminder): TZmReminder => ({
    ...el,
    changed: msToUnix(el.changed),
    startDate: msToISODate(el.startDate),
    endDate: msToISODate(el.endDate),
  }),
}
