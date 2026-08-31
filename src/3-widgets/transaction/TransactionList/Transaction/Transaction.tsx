import type { TTransactionId } from '6-shared/types'

import React from 'react'
import { cn } from '6-shared/ui/shadcn/utils'
import { useContextMenu } from '6-shared/hooks/useContextMenu'
import { core } from 'zerro-core/redux'

import { useAppSelector } from 'store'
import { Symbol, Tags, Amounts, Info, Accounts } from './Transaction.Components'

import './Transaction.css'

export type TTransactionProps = {
  id: TTransactionId
  isChecked: boolean
  isOpened: boolean
  isInSelectionMode: boolean
  // Actions
  onOpen?: (id: TTransactionId) => void
  onToggle?: (id: TTransactionId) => void
  onPayeeClick?: (payee: string) => void
  onContextMenu?: (
    event: React.MouseEvent | React.TouchEvent,
    id: TTransactionId
  ) => void
}

export const Transaction = React.memo(function Transaction(
  props: TTransactionProps
) {
  const {
    id,
    isChecked,
    isOpened,
    isInSelectionMode,
    onOpen,
    onToggle,
    onPayeeClick: onFilterByPayee,
    onContextMenu,
  } = props

  const propsToPass = useContextMenu({
    onClick: () => onOpen?.(id),
    onContextMenu: event => onContextMenu?.(event, id),
  })
  const tr = useAppSelector(state => core.transactions.selectAll(state)[id])
  const getTrType = core.transactions.useType()
  if (!tr) {
    console.warn('Transaction not found', id)
    return null
  }
  const trType = getTrType(tr)
  const { deleted } = tr

  return (
    <div
      className={cn(
        'relative flex cursor-pointer p-3 text-foreground select-none [-webkit-touch-callout:none]',
        // The tinted box behind the row, which is a pseudo-element so that it
        // can sit under content the row's own padding does not cover.
        "before:absolute before:inset-0 before:-z-10 before:rounded-lg before:transition-all before:duration-100 before:ease-in-out before:content-['']",
        // Arriving is animated, but reacting to the pointer is not.
        'hover:before:transition-none active:before:bg-focus-surface',
        isOpened
          ? 'before:bg-focus-surface'
          : 'before:bg-transparent hover:before:bg-muted',
        deleted && 'line-through decoration-error'
      )}
      {...propsToPass}
    >
      <Symbol {...{ tr, trType, isChecked, isInSelectionMode, onToggle }} />
      <div className="ml-4 min-w-0 grow">
        <div className="transaction-line flex type-body">
          <Tags {...{ tr, trType }} />
          <Amounts {...{ tr, trType }} />
        </div>
        <div className="transaction-line mt-1 flex type-body-sm text-muted-foreground">
          <Info {...{ tr, trType, onFilterByPayee }} />
          <Accounts {...{ tr, trType, onFilterByPayee }} />
        </div>
      </div>
    </div>
  )
})
