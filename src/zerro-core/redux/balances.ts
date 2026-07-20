import { fromGraph, graph } from './graph'

export const selectAll = fromGraph(graph.balances)
export const selectByDate = fromGraph(graph.balancesByDate)
export {
  convertBalancesToDisplay as convertToDisplay,
  type TBalanceNode,
} from '../domain/zenmoney'
