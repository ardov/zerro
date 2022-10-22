import React, { FC, ReactNode, useContext } from 'react'
import { useEnvelopePopover } from '@shared/hooks/useEnvelopePopover'
import { TEnvelopeId, TISOMonth } from '@shared/types'
import { GoalPopover } from './GoalPopover'

const GoalPopoverContext = React.createContext<
  (id: TEnvelopeId, anchor: Element) => void
>(() => {})

export const useGoalPopover = () => useContext(GoalPopoverContext)

export const GoalPopoverProvider: FC<{
  children: ReactNode
  month: TISOMonth
}> = props => {
  const goal = useEnvelopePopover(props.month, 'budget')

  return (
    <GoalPopoverContext.Provider value={goal.onOpen}>
      {props.children}
      <GoalPopover {...goal.props} />
    </GoalPopoverContext.Provider>
  )
}
