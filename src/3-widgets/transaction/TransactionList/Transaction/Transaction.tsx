import type { TTransactionId } from '@/6-shared/types'

import React from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { useContextMenu } from '@/6-shared/hooks/useContextMenu'
import { core } from '@/zerro-core/redux'

import { useAppSelector } from '@/store'
import { Symbol, Tags, Amounts, Info, Accounts } from './Transaction.Components'

import './Transaction.css'

export type TTransactionProps = {
  id: TTransactionId
  isChecked: boolean
  isOpened: boolean
  isInSelectionMode: boolean
  onFilterMerchant?: (id: string) => void
  onSearchPayee?: (payee: string) => void
  // Actions
  onOpen?: (id: TTransactionId) => void
  onToggle?: (id: TTransactionId, extendRange?: boolean) => void
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
    onContextMenu,
    onFilterMerchant,
    onSearchPayee,
  } = props

  const propsToPass = useContextMenu({
    onClick: event => {
      if (event.shiftKey && onToggle) onToggle(id, true)
      else onOpen?.(id)
    },
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
  const onPayeeClick =
    tr.merchant && onFilterMerchant
      ? () => onFilterMerchant(tr.merchant!)
      : !tr.merchant && tr.payee && onSearchPayee
        ? () => onSearchPayee(tr.payee!)
        : undefined

  return (
    <div
      className={cn(
        'relative flex cursor-pointer p-3 text-ui-primary select-none [-webkit-touch-callout:none]',
        // The tinted box behind the row, which is a pseudo-element so that it
        // can sit under content the row's own padding does not cover.
        "before:absolute before:inset-0 before:-z-10 before:rounded-lg before:content-['']",
        isOpened
          ? 'before:bg-ui-selected'
          : 'before:bg-transparent hover:before:bg-ui-highlight',
        deleted && 'line-through decoration-ui-error'
      )}
      {...propsToPass}
    >
      <Symbol {...{ tr, trType, isChecked, isInSelectionMode, onToggle }} />
      <div className="ml-4 min-w-0 grow">
        <div className="transaction-line flex text-body">
          <Tags {...{ tr, trType }} />
          <Amounts {...{ tr, trType }} />
        </div>
        <div className="transaction-line mt-1 flex text-body-sm text-ui-secondary">
          <Info {...{ tr, trType, onPayeeClick }} />
          <Accounts {...{ tr, trType, onPayeeClick }} />
        </div>
      </div>
    </div>
  )
})
