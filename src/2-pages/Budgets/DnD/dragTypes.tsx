import type { core } from 'zerro-core/redux'

export enum DragTypes {
  newGroup = 'newGroup',
  amount = 'amount',
  envelope = 'envelope',
}

export type TDragData = {
  type: DragTypes
  id: core.envelopes.TEnvelopeId
  isExpanded?: boolean
  isLastVisibleChild?: boolean
}
