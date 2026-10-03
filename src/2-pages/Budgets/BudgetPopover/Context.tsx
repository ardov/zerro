import type { core } from '@/zerro-core/redux'
import type { FC } from 'react'
import { useCallback } from 'react'

import { useMonth } from '../MonthProvider'
import { BudgetPopover } from './BudgetPopover'
import { useAsk, useAsked } from '@/6-shared/overlays'
import type { TISOMonth } from '@/6-shared/types'

/** A popup, not a screen: this is small editing, like a select. Back closes
 * it, and there is nothing to come back to. */
export const useBudgetPopover = () => {
  const [month] = useMonth()
  const ask = useAsk()
  return useCallback(
    (
      id: core.envelopes.TEnvelopeId,
      anchor?: Element,
      { alignAmount }: { alignAmount?: boolean } = {}
    ) =>
      ask(
        <AskedBudgetPopover
          id={id}
          month={month}
          anchor={anchor}
          alignAmount={alignAmount}
        />
      ),
    [ask, month]
  )
}

const AskedBudgetPopover: FC<{
  id: core.envelopes.TEnvelopeId
  month: TISOMonth
  anchor?: Element | null
  alignAmount?: boolean
}> = ({ id, month, anchor, alignAmount }) => {
  const { open, answer } = useAsked<void>()
  // Built at the moment of the question, so the draft amount starts fresh
  // without a key to force it.
  return (
    <BudgetPopover
      open={open}
      onClose={() => answer()}
      anchor={anchor}
      alignAmount={alignAmount}
      month={month}
      id={id}
    />
  )
}
