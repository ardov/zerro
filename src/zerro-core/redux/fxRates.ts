export { editFxRates as edit, resetFxRates as reset } from './commands'
import type { RootState } from 'store'
import { graph } from './graph'

export const selectCurrent = (state: RootState) =>
  graph.currentFxRates(state.data.current)
export const selectRates = (state: RootState) =>
  graph.fxRates(state.data.current)
export const selectGetter = (state: RootState) =>
  graph.fxRatesGetter(state.data.current)
export const selectConvertFx = (state: RootState) =>
  graph.convertFx(state.data.current)
export type { TFxRates } from '../domain/zerro/fx-rates'
