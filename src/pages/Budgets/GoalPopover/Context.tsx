import { useEnvelopePopover } from '@shared/hooks/useEnvelopePopover'
import { useMonth } from '@shared/hooks/useMonth'
import { TEnvelopeId } from '@shared/types'
import React, { FC, ReactNode, useContext } from 'react'
import { GoalPopover } from './GoalPopover'

const GoalPopoverContext = React.createContext<
  (id: TEnvelopeId, anchor: Element) => void
>(() => {})

export const useGoalPopover = () => useContext(GoalPopoverContext)

export const GoalPopoverProvider: FC<{ children: ReactNode }> = props => {
  const [month] = useMonth()
  const goal = useEnvelopePopover(month, 'budget')
  return (
    <GoalPopoverContext.Provider value={goal.onOpen}>
      {props.children}
      <GoalPopover {...goal.props} />
    </GoalPopoverContext.Provider>
  )
}
