import { TRawReminder, TZmReminder } from 'shared/types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'

export const convertReminder: TZmAdapter<TZmReminder, TRawReminder> = {
  toClient: (el: TZmReminder): TRawReminder => ({
    ...el,
    changed: unixToMs(el.changed),
  }),
  toServer: (el: TRawReminder): TZmReminder => ({
    ...el,
    changed: msToUnix(el.changed),
  }),
}
