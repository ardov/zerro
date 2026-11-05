import type { TDataStore } from '../../zenmoney/model/store'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TCoreContext } from '../../../../types'
import { prepareZerro } from '../operations/prepare'
import type { TFxRates } from './read'
export function compileSetFxRates(
  data: TDataStore,
  month: TISOMonth,
  rates: TFxRates,
  ctx: TCoreContext
) {
  return prepareZerro(data, [{ type: 'fxRates.patch', month, set: rates }], ctx)
}
export function compileResetFxRates(
  data: TDataStore,
  month: TISOMonth,
  ctx: TCoreContext
) {
  return prepareZerro(data, [{ type: 'fxRates.reset', month }], ctx)
}
