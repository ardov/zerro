import { createSelector } from '@reduxjs/toolkit'
import { TEnvelopeId } from 'models/shared/envelopeHelpers'
import { getEnvelopes } from './parts/envelopes'

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
    Object.values(envelopes).forEach(envelope => {
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
