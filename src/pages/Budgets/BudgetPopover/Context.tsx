import { useEnvelopePopover } from '@shared/hooks/useEnvelopePopover'
import { useMonth } from '@shared/hooks/useMonth'
import { TEnvelopeId } from '@shared/types'
import React, { FC, ReactNode, useContext } from 'react'
import { BudgetPopover } from './BudgetPopover'

const BudgetPopoverContext = React.createContext<
  (id: TEnvelopeId, anchor: Element) => void
>(() => {})

export const useBudgetPopover = () => useContext(BudgetPopoverContext)

export const BudgetPopoverProvider: FC<{ children: ReactNode }> = props => {
  const [month] = useMonth()
  const budget = useEnvelopePopover(month, 'budget')
  return (
    <BudgetPopoverContext.Provider value={budget.onOpen}>
      {props.children}
      <BudgetPopover {...budget.props} />
    </BudgetPopoverContext.Provider>
  )
}
