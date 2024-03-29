import React, { FC, useCallback } from 'react'

import { TEnvelopeId } from '5-entities/envelope'
import { useMonth } from '../MonthProvider'
import { BudgetPopover } from './BudgetPopover'
import { registerPopover } from '6-shared/historyPopovers'
import { TISOMonth } from '6-shared/types'
import { PopoverProps } from '@mui/material'

const budgetPopover = registerPopover<
  { id?: TEnvelopeId; month?: TISOMonth },
  PopoverProps
>('budgetPopover', {})

export const useBudgetPopover = () => {
  const [month] = useMonth()
  const { open } = budgetPopover.useMethods()
  const openPopover = useCallback(
    (id: TEnvelopeId, anchorEl?: Element) =>
      open({ id, month }, { anchorEl, key: Date.now() }),
    [month, open]
  )
  return openPopover
}

export const SmartBudgetPopover: FC = () => {
  const popover = budgetPopover.useProps()
  const { month, id } = popover.extraProps
  if (!month || !id) return null
  return <BudgetPopover {...popover.displayProps} {...{ month, id }} />
}
