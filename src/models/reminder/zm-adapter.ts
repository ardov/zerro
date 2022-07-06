import { IReminder, IZmReminder } from 'shared/types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'

export const convertReminder: TZmAdapter<IZmReminder, IReminder> = {
  toClient: (el: IZmReminder): IReminder => ({
    ...el,
    changed: unixToMs(el.changed),
  }),
  toServer: (el: IReminder): IZmReminder => ({
    ...el,
    changed: msToUnix(el.changed),
  }),
}
