import { TReminder, TZmReminder } from 'shared/types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'

export const convertReminder: TZmAdapter<TZmReminder, TReminder> = {
  toClient: (el: TZmReminder): TReminder => ({
    ...el,
    changed: unixToMs(el.changed),
  }),
  toServer: (el: TReminder): TZmReminder => ({
    ...el,
    changed: msToUnix(el.changed),
  }),
}
