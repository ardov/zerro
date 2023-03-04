import React, { FC, useCallback } from 'react'
import { useMonth } from '@shared/hooks/useMonth'
import { usePopoverMethods, usePopoverProps } from '@shared/ui/PopoverManager'

import { TEnvelopeId } from '@entities/envelope'
import { BudgetPopover, TBudgetPopoverProps } from './BudgetPopover'

export const useBudgetPopover = () => {
  const [month] = useMonth()
  const { open } = usePopoverMethods<TBudgetPopoverProps>('budgetPopover')
  const openPopover = useCallback(
    (id: TEnvelopeId, anchorEl?: Element) =>
      open({ id, anchorEl, month, key: Date.now() }),
    [month, open]
  )
  return openPopover
}

export const SmartBudgetPopover: FC = () => {
  const props = usePopoverProps<TBudgetPopoverProps>('budgetPopover')
  if (!props.month || !props.id) return null
  return <BudgetPopover {...props} />
}
