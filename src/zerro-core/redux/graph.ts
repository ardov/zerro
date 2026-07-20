import type { RootState } from 'store'
import type { TDataStore } from '../domain/zenmoney/store'
import { createProjectionGraph } from '../application/graph'

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
 * a selector reads it from `state.data.current`. Use for domain modules that
 * expose a graph node unchanged: `export const selectAll = fromGraph(graph.x)`.
 */
export const fromGraph =
  <T>(node: (data: TDataStore) => T) =>
  (state: RootState): T =>
    node(state.data.current)
