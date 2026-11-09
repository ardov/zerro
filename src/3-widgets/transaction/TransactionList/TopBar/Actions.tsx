import { IconButton } from '@/6-shared/ui/kit/Button'
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
import { track } from '@/6-shared/analytics'
import { usePopup } from '@/6-shared/overlays'
import { toast } from '@/6-shared/ui/kit/Toast'
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
  const transactions = ids
    .map(id => allTransactions[id])
    .filter(
      (transaction): transaction is NonNullable<typeof transaction> =>
        !!transaction
    )
  const instruments = useAppSelector(core.instruments.selectAll)
  const combination = core.transactions.getCombination(
    transactions,
    instruments
  )
  const canMarkViewed = transactions.some(tr => !core.transactions.isViewed(tr))
  const canSetTag =
    transactions.length > 0 &&
    transactions.every(tr => core.transactions.getType(tr) !== 'transfer')
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

  const handleDelete = () => {
    dispatch(core.transactions.remove(ids))
    toast.add({
      type: 'success',
      title: t('deleted', { count: ids.length }),
    })
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
  if (canMarkViewed)
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
  if (combination === 'outcome')
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
  if (combination === 'income')
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
  if (combination === 'collapse')
    items.push({
      id: 'collapse',
      label: t('mergeTransactions'),
      description: t('mergeTransactionsComment'),
      start: <MergeTypeIcon />,
      onSelect: handleDelete,
    })
  if (combination === 'transfer')
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
        className="pointer-events-none absolute bottom-4 left-1/2 z-[1000] max-w-full px-2"
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
          {canSetTag && (
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

export default Actions
