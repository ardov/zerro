import { TEnvelopeId } from '@entities/envelope'
import { useEnvelopePopover } from '@shared/hooks/useEnvelopePopover'
import { TISOMonth } from '@shared/types'
import React, { FC, ReactNode, useContext } from 'react'
import { BudgetPopover } from './BudgetPopover'

const BudgetPopoverContext = React.createContext<
  (id: TEnvelopeId, anchor: Element) => void
>(() => {})

export const useBudgetPopover = () => useContext(BudgetPopoverContext)

export const BudgetPopoverProvider: FC<{
  children: ReactNode
  month: TISOMonth
}> = props => {
  const budget = useEnvelopePopover(props.month, 'budget')
  return (
    <BudgetPopoverContext.Provider value={budget.onOpen}>
      {props.children}
      <BudgetPopover {...budget.props} />
    </BudgetPopoverContext.Provider>
  )
}
