import type { FC } from 'react'
import { useRef } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { Amount } from '@/6-shared/ui/Amount'

import { Btn } from './Btn'

type BudgetCellProps = {
  value: number
  isSelf?: boolean
  onBudgetClick: (anchor: HTMLSpanElement) => void
}

export const BudgetCell: FC<BudgetCellProps> = props => {
  const { value, onBudgetClick, isSelf } = props
  const amountRef = useRef<HTMLSpanElement>(null)
  return (
    <div
      className={cn(
        'flex justify-end',
        isSelf || !value ? 'text-disabled-foreground' : 'text-foreground'
      )}
    >
      <Btn onClick={() => onBudgetClick(amountRef.current!)} disabled={isSelf}>
        <span ref={amountRef} className="inline-block">
          <Amount value={value} decimals="ifOnly" />
        </span>
      </Btn>
    </div>
  )
}
