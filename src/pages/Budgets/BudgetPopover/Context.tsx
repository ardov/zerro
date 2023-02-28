import React, { FC, useCallback } from 'react'
import { useMonth } from '@shared/hooks/useMonth'
import { usePopover } from '@shared/ui/PopoverManager'

import { TEnvelopeId } from '@entities/envelope'
import { BudgetPopover, TBudgetPopoverProps } from './BudgetPopover'

export const useBudgetPopover = () => {
  const [month] = useMonth()
  const { open } = usePopover<TBudgetPopoverProps>('budgetPopover')
  const openPopover = useCallback(
    (id: TEnvelopeId, anchorEl?: Element) => open({ id, anchorEl, month }),
    [month, open]
  )
  return openPopover
}

export const SmartBudgetPopover: FC = () => {
  const popover = usePopover<TBudgetPopoverProps>('budgetPopover')
  if (!popover.props.month || !popover.props.id) return null
  return <BudgetPopover {...popover.props} />
}
