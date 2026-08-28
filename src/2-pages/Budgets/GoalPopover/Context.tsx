import type { core } from 'zerro-core/redux'
import type { FC } from 'react'
import { useCallback } from 'react'
import { useMonth } from '../MonthProvider'

import { GoalPopover } from './GoalPopover'
import { registerPopover } from '6-shared/historyPopovers'
import type { TISOMonth } from '6-shared/types'
import type { PopoverProps } from '6-shared/ui/Popover'

const goalPopover = registerPopover<
  { id?: core.envelopes.TEnvelopeId; month?: TISOMonth },
  PopoverProps
>('goalPopover', {})

export const useGoalPopover = () => {
  const [month] = useMonth()
  const { open } = goalPopover.useMethods()
  const openPopover = useCallback(
    (id: core.envelopes.TEnvelopeId, anchorEl?: Element) =>
      open({ id, month }, { anchorEl }),
    [month, open]
  )
  return openPopover
}

export const SmartGoalPopover: FC = () => {
  const popover = goalPopover.useProps()
  const { month, id } = popover.extraProps
  if (!month || !id) return null
  // Keyed by the opening, so each one starts from a fresh draft.
  return (
    <GoalPopover
      key={popover.instanceKey}
      {...popover.displayProps}
      {...{ month, id }}
    />
  )
}
