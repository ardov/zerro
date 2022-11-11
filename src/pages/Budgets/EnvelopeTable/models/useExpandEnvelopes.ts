import { useState } from 'react'
import { toISOMonth } from '@shared/helpers/date'
import { TEnvelopeId, TISOMonth } from '@shared/types'
import { useEnvRenderInfo } from './envRenderInfo'

export function useExpandEnvelopes(month: TISOMonth = toISOMonth(new Date())): {
  expanded: TEnvelopeId[]
  toggle: (id: TEnvelopeId) => void
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
    toggle: (id: TEnvelopeId) => {
      expanded.includes(id)
        ? setExpanded(expanded => expanded.filter(e => e !== id))
        : setExpanded([...expanded, id])
    },
    expandAll: () => {
      let expandedList = Object.values(renderInfo)
        .filter(e => e.hasChildren)
        .map(e => e.id)
      setExpanded(expandedList)
    },
    collapseAll: () => setExpanded([]),
  }
}
