import type { core } from 'zerro-core/redux'
import { useState } from 'react'
import { toISOMonth } from '6-shared/helpers/date'
import type { TISOMonth } from '6-shared/types'
import { useEnvRenderInfo } from './envRenderInfo'

export function useExpandEnvelopes(month: TISOMonth = toISOMonth(new Date())): {
  expanded: core.envelopes.TEnvelopeId[]
  toggle: (id: core.envelopes.TEnvelopeId) => void
  expandAll: () => void
  collapseAll: () => void
} {
  const renderInfo = useEnvRenderInfo(month)
  const defaultExpanded = Object.values(renderInfo)
    .filter(e => e.isDefaultExpanded)
    .map(e => e.id)

  const [expanded, setExpanded] = useState(defaultExpanded)
  return {
    expanded,
    toggle: (id: core.envelopes.TEnvelopeId) => {
      expanded.includes(id)
        ? setExpanded(expanded => expanded.filter(e => e !== id))
        : setExpanded([...expanded, id])
    },
    expandAll: () => {
      const expandedList = Object.values(renderInfo)
        .filter(e => e.hasChildren)
        .map(e => e.id)
      setExpanded(expandedList)
    },
    collapseAll: () => setExpanded([]),
  }
}
