import React, { FC, useCallback } from 'react'
import { useMonth } from '@shared/hooks/useMonth'
import { usePopover } from '@shared/ui/PopoverManager'

import { TEnvelopeId } from '@entities/envelope'
import { GoalPopover, TGoalPopoverProps } from './GoalPopover'

const goalPopoverKey = 'goalPopover'

export const useGoalPopover = () => {
  const [month] = useMonth()
  const { open } = usePopover<TGoalPopoverProps>(goalPopoverKey)
  const openPopover = useCallback(
    (id: TEnvelopeId, anchorEl: Element) => open({ id, anchorEl, month }),
    [month, open]
  )
  return openPopover
}

export const SmartGoalPopover: FC = () => {
  const popover = usePopover<TGoalPopoverProps>(goalPopoverKey)
  if (!popover.props.month || !popover.props.id) return null
  return <GoalPopover {...popover.props} />
}
