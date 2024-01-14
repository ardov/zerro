import { TEnvelopeId } from '5-entities/envelope'

export enum DragTypes {
  newGroup = 'newGroup',
  amount = 'amount',
  envelope = 'envelope',
}

export type TDragData = {
  type: DragTypes
  id: TEnvelopeId
  isExpanded?: boolean
  isLastVisibleChild?: boolean
}
