import type { FC } from 'react'
import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '@/6-shared/ui/Tooltip'
import { formatMoney } from '@/6-shared/helpers/money'
import { WarningIcon } from '@/6-shared/ui/Icons'
import { Amount } from '@/6-shared/ui/Amount'
import { DragTypes } from '@/2-pages/Budgets/DnD'

type AvailableCellProps = {
  id: string
  hiddenOverspend?: number
  available: number
  assigned: number
  isChild?: boolean
  isSelf?: boolean
}

export const AvailableCell: FC<AvailableCellProps> = props => {
  const { hiddenOverspend, id, available, isChild, assigned, isSelf } = props
  const { t } = useTranslation('budgets')
  const availableColor = getAvailableColor(
    available,
    isChild,
    !!assigned,
    isSelf
  )

  return (
    <div>
      <p className="m-0 text-right type-body">
        {!!hiddenOverspend && (
          <Tooltip
            title={
              <span>
                {t('parentOverspend', {
                  amount: formatMoney(-hiddenOverspend),
                })}
              </span>
            }
          >
            <WarningIcon
              size={20}
              color="warning"
              className="-translate-x-[6px] translate-y-1"
            />
          </Tooltip>
        )}

        <DraggableAmount id={id} type={DragTypes.amount} disabled={isSelf}>
          <span
            className={cn(
              '-my-1 -mx-4 inline-block rounded-lg px-4 py-1',
              getAvailableColorClass(availableColor)
            )}
          >
            <Amount value={available} decimals="ifOnly" />
          </span>
        </DraggableAmount>
      </p>
    </div>
  )
}

const DraggableAmount: FC<{
  id: string
  children: React.ReactNode
  type: DragTypes
  disabled?: boolean
}> = props => {
  const { id, children, disabled, type } = props
  const { setNodeRef, attributes, listeners } = useDraggable({
    id: 'amount' + id,
    disabled,
    data: { type, id },
  })
  return (
    <span
      style={{
        userSelect: 'none',
        touchAction: 'manipulation',
        cursor: 'grab',
      }}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      {children}
    </span>
  )
}

export function getAvailableColor(
  available: number,
  isChild?: boolean,
  hasAssigned?: boolean,
  isSelf?: boolean
) {
  const positive = 'success.main'
  const negative = 'error.main'
  const neutral = 'text.disabled'

  if (isSelf) return neutral

  if (available === 0) return neutral
  if (available > 0) return positive

  // available < 0
  // main tag or child with budget
  if (!isChild || hasAssigned) return negative
  // child tag without budget
  else return neutral
}

export function getAvailableColorClass(color: string) {
  switch (color) {
    case 'success.main':
      return 'text-success'
    case 'error.main':
      return 'text-error'
    default:
      return 'text-disabled-foreground'
  }
}
