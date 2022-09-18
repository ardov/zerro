import { useState } from 'react'
import { isZero } from '@shared/helpers/money'
import { toISOMonth } from '@shared/helpers/date'
import { TEnvelopeId, TISOMonth } from '@shared/types'
import { useEnvelopeGroups } from './envelopeGroups'

export function useExpandEnvelopes(month: TISOMonth = toISOMonth(new Date())): {
  expanded: TEnvelopeId[]
  toggle: (id: TEnvelopeId) => void
  expandAll: () => void
  collapseAll: () => void
} {
  const groups = useEnvelopeGroups(month)
  const defaultExpanded: TEnvelopeId[] = []
  groups.forEach(group => {
    group.children.forEach(node => {
      if (
        !isZero(node.childrenLeftover) ||
        !isZero(node.childrenBudgeted) ||
        !isZero(node.childrenSurplus)
      ) {
        defaultExpanded.push(node.id)
      }
    })
  })
  const [expanded, setExpanded] = useState(defaultExpanded)
  return {
    expanded,
    toggle: (id: TEnvelopeId) => {
      expanded.includes(id)
        ? setExpanded(expanded => expanded.filter(e => e !== id))
        : setExpanded([...expanded, id])
    },
    expandAll: () => {
      let expandedList: TEnvelopeId[] = []
      groups.forEach(group => {
        group.children.forEach(node => {
          expandedList.push(node.id)
        })
      })
      setExpanded(expandedList)
    },
    collapseAll: () => setExpanded([]),
  }
}
