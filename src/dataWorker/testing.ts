import { getLocalData } from './getLocalData'
import { createEffect } from 'effector'
import { setRawInstruments } from './models/instrument'
import { setRawUsers } from './models/user'
import { setRawReminders } from './models/reminders'
import { setRawTags } from './models/tags'

const loadLocalDataFx = createEffect({
  name: 'loadLocalData',
  handler: async () => {
    let data = await getLocalData()
    console.log('Data loaded', data)
    if (data.instrument) setRawInstruments(data.instrument)
    if (data.user) setRawUsers(data.user)
    if (data.reminder) setRawReminders(data.reminder)
    if (data.tag) setRawTags(data.tag)
    return data
  },
})

export async function testNewFLow() {
  loadLocalDataFx()
}
