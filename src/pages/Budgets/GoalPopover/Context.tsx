import React, { FC, useCallback } from 'react'
import { useMonth } from '../MonthProvider'

import { TEnvelopeId } from '@entities/envelope'
import { GoalPopover } from './GoalPopover'
import { makePopoverHooks } from '@shared/ui/PopoverManager'
import { TISOMonth } from '@shared/types'
import { PopoverProps } from '@mui/material'

const goalPopover = makePopoverHooks<
  { id?: TEnvelopeId; month?: TISOMonth },
  PopoverProps
>('goalPopover', {})

export const useGoalPopover = () => {
  const [month] = useMonth()
  const { open } = goalPopover.useMethods()
  const openPopover = useCallback(
    (id: TEnvelopeId, anchorEl?: Element) =>
      open({ id, month }, { anchorEl, key: Date.now() }),
    [month, open]
  )
  return openPopover
}

export const SmartGoalPopover: FC = () => {
  const popover = goalPopover.useProps()
  const { month, id } = popover.extraProps
  if (!month || !id) return null
  return <GoalPopover {...popover.displayProps} {...{ month, id }} />
}
