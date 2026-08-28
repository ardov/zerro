import type { core } from 'zerro-core/redux'
import type { FC } from 'react'
import { useCallback } from 'react'

import { useMonth } from '../MonthProvider'
import { BudgetPopover } from './BudgetPopover'
import { registerPopover } from '6-shared/historyPopovers'
import type { TISOMonth } from '6-shared/types'
import type { AdaptivePopoverProps } from '6-shared/ui/AdaptivePopover'

const budgetPopover = registerPopover<
  { id?: core.envelopes.TEnvelopeId; month?: TISOMonth },
  AdaptivePopoverProps
>('budgetPopover', {})

export const useBudgetPopover = () => {
  const [month] = useMonth()
  const { open } = budgetPopover.useMethods()
  const openPopover = useCallback(
    (id: core.envelopes.TEnvelopeId, anchorEl?: Element) =>
      open({ id, month }, { anchorEl }),
    [month, open]
  )
  return openPopover
}

export const SmartBudgetPopover: FC = () => {
  const popover = budgetPopover.useProps()
  const { month, id } = popover.extraProps
  if (!month || !id) return null
  // Keyed by the opening, so each one starts from a fresh draft amount.
  return (
    <BudgetPopover
      key={popover.instanceKey}
      {...popover.displayProps}
      month={month}
      id={id}
    />
  )
}
