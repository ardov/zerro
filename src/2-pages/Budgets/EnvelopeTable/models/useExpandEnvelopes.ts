import { useState } from 'react'
import { toISOMonth } from '6-shared/helpers/date'
import { TISOMonth } from '6-shared/types'
import { useEnvRenderInfo } from './envRenderInfo'
import { TEnvelopeId } from '5-entities/envelope'

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
