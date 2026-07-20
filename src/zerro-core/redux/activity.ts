import type { RootState } from 'store'
import { graph } from './graph'

export const selectCurrentFunds = (state: RootState) =>
  graph.currentFunds(state.data.current)
export const selectTransactionRoutingContext = (state: RootState) =>
  graph.routingContext(state.data.current)
export const selectRaw = (state: RootState) =>
  graph.rawActivity(state.data.current)
export const selectAll = (state: RootState) =>
  graph.activity(state.data.current)
export const selectEnvelopeMetrics = (state: RootState) =>
  graph.envMetrics(state.data.current)
export const selectSorted = (state: RootState) =>
  graph.sortedActivity(state.data.current)
export type { TActivitySummary, TSortedActivityNode } from '../domain/zerro'
