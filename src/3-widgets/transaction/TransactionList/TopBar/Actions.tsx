import { IconButton } from '@/6-shared/ui/kit/Button'
import type { TTransaction } from '@/6-shared/types'
import { core } from '@/zerro-core/redux'

import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip } from '@/6-shared/ui/kit/Chip'
import { Menu, type MenuItem } from '@/6-shared/ui/kit/Menu'
import {
  EditIcon,
  CategoryIcon,
  DoneAllIcon,
  MoreVertIcon,
  VisibilityIcon,
  MergeTypeIcon,
  DeleteIcon,
} from '@/6-shared/ui/Icons'
import { addFxAmount, createFxAmount } from '@/6-shared/helpers/money'
import { track } from '@/6-shared/analytics'
import { useAsk, usePopup } from '@/6-shared/overlays'
import { Confirm } from '@/6-shared/ui/kit/Confirm'
import { useAppDispatch, useAppSelector } from '@/store'

import { CategorySelect } from '../../../category/CategorySelect'
import { BulkEditModal } from './BulkEditModal'
import './transitions.css'

type ActionsProps = {
  visible: boolean
  checkedIds: string[]
  onUncheckAll: () => void
  onCheckAll: () => void
}

const Actions: FC<ActionsProps> = ({
  visible,
  checkedIds,
  onUncheckAll,
  onCheckAll,
}) => {
  const { t } = useTranslation('transactionActions')
  const dispatch = useAppDispatch()
  const allTransactions = useAppSelector(core.transactions.selectAll)
  const [ids, setIds] = useState(checkedIds)
  const transactions = ids?.map(id => allTransactions[id])
  const actions = getAvailableActions(transactions)
  // Both are on the overlay stack, so Back closes the dialog or the menu
  // instead of leaving the page — which is what it used to do here.
  const menuPopup = usePopup()
  const editPopup = usePopup()
  const closeMenu = () => menuPopup.setOpen(false)
  const setMenuOpen = menuPopup.setOpen

  const [prevChecked, setPrevChecked] = useState({ visible, checkedIds })
  if (
    prevChecked.visible !== visible ||
    prevChecked.checkedIds !== checkedIds
  ) {
    setPrevChecked({ visible, checkedIds })
    if (visible) setIds(checkedIds)
  }

  // The bar going away takes its menu with it. Closing one is a history step,
  // so it cannot happen during render.
  useEffect(() => {
    if (!visible) setMenuOpen(false)
  }, [visible, setMenuOpen])

  const handleSetTag = (id: string) => {
    dispatch(core.transactions.bulkEdit(checkedIds, { tags: [id] }))
    track('transaction_tags_changed', {
      mode: 'bulk',
      source: 'bulk_toolbar',
    })
    closeMenu()
    onUncheckAll()
  }

  const ask = useAsk()
  const handleDelete = async () => {
    const confirmed = await ask(
      <Confirm
        intent="danger"
        title={t('delete', { count: ids.length })}
        okText={t('deleteBtn')}
        cancelText={t('cancelDeletion')}
      />
    )
    if (!confirmed) return
    dispatch(core.transactions.remove(checkedIds))
    track('transaction_deleted', { mode: 'bulk', source: 'bulk_toolbar' })
    closeMenu()
    onUncheckAll()
  }

  const handleCheckAll = () => {
    onCheckAll()
    closeMenu()
  }

  const handleMarkViewed = () => {
    dispatch(core.transactions.setViewed(checkedIds, true))
    track('transaction_viewed_changed', {
      viewed: true,
      mode: 'bulk',
      source: 'bulk_toolbar',
    })
    closeMenu()
    onUncheckAll()
  }

  const items: MenuItem[] = []
  if (actions.markViewed)
    items.push({
      id: 'viewed',
      label: t('markViewed'),
      start: <VisibilityIcon />,
      onSelect: handleMarkViewed,
    })
  items.push({
    id: 'edit',
    label: t('edit'),
    start: <EditIcon />,
    onSelect: () => editPopup.setOpen(true),
  })
  if (actions.combineToOutcome)
    items.push({
      id: 'outcome',
      label: t('combineToOutcome'),
      description: t('combineToOutcomeComment'),
      start: <MergeTypeIcon />,
      onSelect: () => {
        dispatch(core.transactions.combineToOutcome(ids))
        track('transactions_combined', {
          result_type: 'outcome',
          source: 'bulk_toolbar',
        })
        onUncheckAll()
      },
    })
  if (actions.combineToIncome)
    items.push({
      id: 'income',
      label: t('combineToIncome'),
      description: t('combineToIncomeComment'),
      start: <MergeTypeIcon />,
      onSelect: () => {
        dispatch(core.transactions.combineToIncome(ids))
        track('transactions_combined', {
          result_type: 'income',
          source: 'bulk_toolbar',
        })
        onUncheckAll()
      },
    })
  if (actions.collapseTransactionsEasy)
    items.push({
      id: 'collapse',
      label: t('mergeTransactions'),
      description: t('mergeTransactionsComment'),
      start: <MergeTypeIcon />,
      onSelect: handleDelete,
    })
  if (actions.canMergeAsTransfer)
    items.push({
      id: 'transfer',
      label: t('mergeAsTransfer'),
      description: t('mergeAsTransferComment'),
      start: <MergeTypeIcon />,
      onSelect: () => {
        dispatch(core.transactions.mergeAsTransfer(ids))
        track('transactions_combined', {
          result_type: 'transfer',
          source: 'bulk_toolbar',
        })
        onUncheckAll()
      },
    })
  items.push(
    { id: 'separator', type: 'separator' },
    {
      id: 'all',
      label: t('selectAll'),
      start: <DoneAllIcon />,
      onSelect: handleCheckAll,
    }
  )

  return (
    <>
      <BulkEditModal
        ids={checkedIds}
        controller={editPopup}
        onApply={() => {
          editPopup.setOpen(false)
          onUncheckAll()
        }}
      />
      <div
        style={{ transform: 'translateX(-50%)' }}
        className="absolute bottom-[calc(var(--bottom-inset,0px)+1rem)] left-1/2 z-[1000] max-w-full px-2"
      >
        <div
          data-visible={visible ? '' : undefined}
          aria-hidden={!visible}
          inert={!visible}
          className="actions-transition flex items-center gap-1 rounded-ui-card rounded-smooth bg-ui-card p-2 text-ui-primary shadow-ui-popover"
        >
          <Chip
            className="min-w-0 shrink"
            onRemove={onUncheckAll}
            variant="outline"
          >
            {t('selected', { count: ids.length })}
          </Chip>
          <IconButton
            variant="ghost"
            size="sm"
            label={t('deleteSelected')}
            onClick={handleDelete}
          >
            <DeleteIcon />
          </IconButton>
          {actions.setMainTag && (
            <CategorySelect
              onSelect={handleSetTag}
              trigger={
                <IconButton variant="ghost" size="sm" label={t('setCategory')}>
                  <CategoryIcon />
                </IconButton>
              }
            />
          )}
          <Menu
            label={t('actions')}
            popup={menuPopup}
            disabled={!visible}
            items={items}
            trigger={
              <IconButton
                variant="ghost"
                size="sm"
                label={t('actions')}
                tooltip={!menuPopup.open && !editPopup.open}
              >
                <MoreVertIcon />
              </IconButton>
            }
          />
        </div>
      </div>
    </>
  )
}

function getAvailableActions(transactions: TTransaction[]) {
  const { incomes, outcomes, transfers } = groupByType(transactions)
  const instCodeMap = core.instruments.useCodeMap()
  const toDisplay = core.currency.useToDisplay('current')

  const totalOutcome = toDisplay(
    addFxAmount(
      ...outcomes.map(tr =>
        createFxAmount(instCodeMap[tr.outcomeInstrument], tr.outcome)
      )
    )
  )
  const totalIncome = toDisplay(
    addFxAmount(
      ...incomes.map(tr =>
        createFxAmount(instCodeMap[tr.incomeInstrument], tr.income)
      )
    )
  )
  const sameInstruments = hasSameInOutInstruments()
  const sameAccounts = hasSameInOutAccounts()

  return {
    delete: true,
    setMainTag: !transfers.length && (incomes.length || outcomes.length),
    bulkEdit: true,
    markViewed: transactions.some(tr => !core.transactions.isViewed(tr)),
    combineToOutcome: canCombineToOutcome(),
    combineToIncome: canCombineToIncome(),
    collapseTransactionsEasy: canCollapseTransactionsEasy(),
    canMergeAsTransfer: canMergeAsTransfer(),
  }

  function hasSameInOutInstruments() {
    const instruments = new Set<number>()
    outcomes.forEach(tr => instruments.add(tr.outcomeInstrument))
    incomes.forEach(tr => instruments.add(tr.incomeInstrument))
    return instruments.size === 1
  }
  function hasSameInOutAccounts() {
    const accounts = new Set<string | null>()
    outcomes.forEach(tr => accounts.add(tr.outcomeAccount))
    incomes.forEach(tr => accounts.add(tr.incomeAccount))
    return accounts.size === 1
  }

  function canMergeAsTransfer(): boolean {
    // One outcome and one income from different accounts
    const canBeTransfer =
      transfers.length === 0 &&
      outcomes.length === 1 &&
      incomes.length === 1 &&
      !sameAccounts
    if (!canBeTransfer) return false
    // Strict equality for same instruments
    if (sameInstruments) return totalOutcome === totalIncome
    // Approximately equal for different instruments (15% tolerance)
    return areApproximatelyEqual(totalIncome, totalOutcome, 0.15)
  }
  function canCollapseTransactionsEasy(): boolean {
    return (
      transfers.length === 0 &&
      outcomes.length > 0 &&
      incomes.length > 0 &&
      sameInstruments &&
      sameAccounts &&
      totalOutcome === totalIncome
    )
  }
  function canCombineToOutcome(): boolean {
    return (
      transfers.length === 0 &&
      outcomes.length === 1 &&
      incomes.length > 0 &&
      sameInstruments &&
      totalOutcome > totalIncome
    )
  }
  function canCombineToIncome(): boolean {
    return (
      transfers.length === 0 &&
      outcomes.length > 0 &&
      incomes.length === 1 &&
      sameInstruments &&
      totalOutcome < totalIncome
    )
  }
}

function areApproximatelyEqual(
  a: number,
  b: number,
  tolerance: number = 0.1
): boolean {
  const difference = Math.abs(a - b)
  const maxAllowedDifference = Math.max(Math.abs(a), Math.abs(b)) * tolerance
  return difference <= maxAllowedDifference
}

function groupByType(list: TTransaction[] = []) {
  const incomes: TTransaction[] = []
  const outcomes: TTransaction[] = []
  const transfers: TTransaction[] = []

  list?.forEach(tr => {
    const trType = core.transactions.getType(tr)
    if (trType === 'income') incomes.push(tr)
    if (trType === 'outcome') outcomes.push(tr)
    if (trType === 'transfer') transfers.push(tr)
  })

  return { incomes, outcomes, transfers }
}

export default Actions
