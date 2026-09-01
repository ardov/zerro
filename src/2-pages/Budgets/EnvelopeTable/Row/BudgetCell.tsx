import type { FC } from 'react'
import React from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { Amount } from '@/6-shared/ui/Amount'

import { Btn } from './Btn'

type BudgetCellProps = {
  value: number
  isSelf?: boolean
  onBudgetClick: React.MouseEventHandler<HTMLButtonElement>
}

export const BudgetCell: FC<BudgetCellProps> = props => {
  const { value, onBudgetClick, isSelf } = props
  return (
    <div
      className={cn(
        'flex justify-end',
        isSelf || !value ? 'text-disabled-foreground' : 'text-foreground'
      )}
    >
      <Btn onClick={onBudgetClick} disabled={isSelf}>
        <Amount value={value} decimals="ifOnly" />
      </Btn>
    </div>
  )
}
