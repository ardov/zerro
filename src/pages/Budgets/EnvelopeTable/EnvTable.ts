import { TEnvelopeId, TISOMonth } from '@shared/types'

// Structure sceleton
type Structure = { group: string; children: any[] }[]

// Envelope options
type DefaultHiddenEnvelopes = TEnvelopeId[]
type HiddenEnvelopes = TEnvelopeId[]
type ExpandedRows = TEnvelopeId[] // initialize for first opened month
type Selected = TEnvelopeId

// View options
type ReorderHandles = boolean
type VisibleColumns = ('budgeted' | 'activity' | 'available')[]

type RowProps = {
  id: TEnvelopeId
  isSelf: boolean
  isReorderMode: boolean
  isDefaultVisible: boolean
  isSelected: boolean
  isLastVisibleChild: boolean
  // canDragUnder: boolean
  // canDragInto: boolean
  metric: 'budgeted' | 'activity' | 'available'

  onOpenDetails: (id: TEnvelopeId) => void
  onOpenTransactions: (id: TEnvelopeId) => void

  month: TISOMonth
}
