import type { RootState } from '@/store'
import type { TDataStore } from '../../internal/domain/zenmoney/model/store'
import { createProjectionGraph } from '../../internal/projections/graph'
import { selectData } from './state'

/** Share memoized nodes across Redux snapshots. UUID generation in a read indicates a leaked command path. */
export const graph = createProjectionGraph({
  now: () => Date.now(),
  uuid: () => {
    throw new Error('Projections must not generate ids')
  },
})

/** Use fromGraph for domain selectors that expose a graph node unchanged; selectData owns the Redux path. */
export const fromGraph =
  <T>(node: (data: TDataStore) => T) =>
  (state: RootState): T =>
    node(selectData(state))
