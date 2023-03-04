import React, { FC, useCallback } from 'react'
import { useMonth } from '../MonthProvider'
import { usePopoverMethods, usePopoverProps } from '@shared/ui/PopoverManager'

import { TEnvelopeId } from '@entities/envelope'
import { GoalPopover, TGoalPopoverProps } from './GoalPopover'

const goalPopoverKey = 'goalPopover'

export const useGoalPopover = () => {
  const [month] = useMonth()
  const { open } = usePopoverMethods<TGoalPopoverProps>(goalPopoverKey)
  const openPopover = useCallback(
    (id: TEnvelopeId, anchorEl: Element) =>
      open({ id, anchorEl, month, key: Date.now() }),
    [month, open]
  )
  return openPopover
}

export const SmartGoalPopover: FC = () => {
  const props = usePopoverProps<TGoalPopoverProps>(goalPopoverKey)
  if (!props.month || !props.id) return null
  return <GoalPopover {...props} />
}
