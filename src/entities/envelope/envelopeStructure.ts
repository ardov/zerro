import { createSelector } from '@reduxjs/toolkit'
import { TEnvelopeId } from '@shared/types'
import { getEnvelopes } from './getEnvelopes'

type TGroup = {
  name: string
  children: {
    id: TEnvelopeId
    children: TEnvelopeId[]
  }[]
}

export const getEnvelopeStructure = createSelector(
  [getEnvelopes],
  envelopes => {
    const groups: Record<string, TGroup> = {}
    Object.values(envelopes)
      .sort((a, b) => a.index - b.index)
      .forEach(envelope => {
        if (envelope.parent) return
        groups[envelope.group] ??= { name: envelope.group, children: [] }
        groups[envelope.group].children.push({
          id: envelope.id,
          children: envelope.children,
        })
      })
    return Object.values(groups)
  }
)
