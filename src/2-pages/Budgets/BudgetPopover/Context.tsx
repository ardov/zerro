import { core } from 'zerro-core/redux'
import { FC, useCallback } from 'react'

import { useMonth } from '../MonthProvider'
import { BudgetPopover } from './BudgetPopover'
import { registerPopover } from '6-shared/historyPopovers'
import { TISOMonth } from '6-shared/types'
import { PopoverProps } from '@mui/material'

const budgetPopover = registerPopover<
  { id?: core.envelopes.TEnvelopeId; month?: TISOMonth },
  PopoverProps
>('budgetPopover', {})

export const useBudgetPopover = () => {
  const [month] = useMonth()
  const { open } = budgetPopover.useMethods()
  const openPopover = useCallback(
    (id: core.envelopes.TEnvelopeId, anchorEl?: Element) =>
      open({ id, month }, { anchorEl, key: Date.now() }),
    [month, open]
  )
  return openPopover
}

export const SmartBudgetPopover: FC = () => {
  const popover = budgetPopover.useProps()
  const { month, id } = popover.extraProps
  if (!month || !id) return null
  const { key, ...displayProps } = popover.displayProps
  return <BudgetPopover key={key} {...displayProps} month={month} id={id} />
}
