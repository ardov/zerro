import type { TDataStore } from '../../zenmoney/model/store'
import type { TCoreContext } from '../../../../types'
import { prepareZerro } from '../operations/prepare'
import type { TUserSettingsPatch } from './types'
export function compilePatchUserSettings(
  data: TDataStore,
  update: TUserSettingsPatch,
  ctx: TCoreContext
) {
  return prepareZerro(
    data,
    [
      {
        type: 'settings.patch',
        set: Object.fromEntries(
          Object.entries(update).filter(([, value]) => value !== undefined)
        ),
        unset: (Object.keys(update) as (keyof TUserSettingsPatch)[]).filter(
          key => update[key] === undefined
        ),
      },
    ],
    ctx
  )
}
