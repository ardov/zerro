export { editFxRates as edit, resetFxRates as reset } from './commands'
import { fromGraph, graph } from './graph'

export const selectCurrent = fromGraph(graph.currentFxRates)
export const selectRates = fromGraph(graph.fxRates)
export const selectGetter = fromGraph(graph.fxRatesGetter)
export const selectConvertFx = fromGraph(graph.convertFx)
export type { TFxRates } from '../../internal/domain/zerro'
