import type { RootState } from 'store'
import type { TDataStore } from '../../internal/domain/zenmoney/model/store'
import { createProjectionGraph } from '../../internal/projections/graph'
import { selectData } from './state'

/**
 * One graph instance for the app, so every node memoizes across snapshots
 * exactly as the hand-written `createSelector` chain used to.
 *
 * Projections never create entities, so `uuid` is a trap rather than a
 * generator: reaching it means a command compiler leaked into a read path.
 */
export const graph = createProjectionGraph({
  now: () => Date.now(),
  uuid: () => {
    throw new Error('Projections must not generate ids')
  },
})

/**
 * Adapts a graph node into a Redux selector. The node reads a `TDataStore`;
 * `selectData` owns the Redux path. Use for domain modules that expose a graph
 * node unchanged: `export const selectAll = fromGraph(graph.x)`.
 */
export const fromGraph =
  <T>(node: (data: TDataStore) => T) =>
  (state: RootState): T =>
    node(selectData(state))
