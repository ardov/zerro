import { IconButton } from '6-shared/ui/Button'
import type { TTransaction } from '6-shared/types'
import { core } from 'zerro-core/redux'

import type { FC } from 'react'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CSSTransition } from 'react-transition-group'
import { Chip } from '6-shared/ui/Chip'
import { Menu, MenuItem } from '6-shared/ui/Menu'
import { ListRowIcon, ListRowText } from '6-shared/ui/ListRow'
import { Divider } from '6-shared/ui/Divider'
import {
  EditIcon,
  LocalOfferOutlinedIcon,
  DoneAllIcon,
  MoreVertIcon,
  VisibilityIcon,
  MergeTypeIcon,
  DeleteIcon,
} from '6-shared/ui/Icons'
import { Tooltip } from '6-shared/ui/Tooltip'
import { addFxAmount, createFxAmount } from '6-shared/helpers/money'
import { track } from '6-shared/analytics'
import { useConfirm } from '6-shared/ui/SmartConfirm'
import { useAppDispatch, useAppSelector } from 'store'

import { TagSelect2 } from '../../TagSelect/TagSelect2'
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
  const actionsRef = useRef<HTMLDivElement>(null)
  const [ids, setIds] = useState(checkedIds)
  const transactions = ids?.map(id => allTransactions[id])
  const actions = getAvailableActions(transactions)
  const [editModalVisible, setEditModalVisible] = useState(false)

  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  const handleClick: React.MouseEventHandler = event =>
    setAnchorEl(event.currentTarget)
  const closeMenu = () => setAnchorEl(null)

  const [prevChecked, setPrevChecked] = useState({ visible, checkedIds })
  if (
    prevChecked.visible !== visible ||
    prevChecked.checkedIds !== checkedIds
  ) {
    setPrevChecked({ visible, checkedIds })
    if (visible) setIds(checkedIds)
  }

  const handleSetTag = (id: string) => {
    if (!id || id === 'null')
      dispatch(core.transactions.bulkEdit(checkedIds, { tags: [] }))
    else dispatch(core.transactions.bulkEdit(checkedIds, { tags: [id] }))
    track('transaction_tags_changed', {
      mode: 'bulk',
      source: 'bulk_toolbar',
    })
    closeMenu()
    onUncheckAll()
  }

  const handleDelete = useConfirm({
    title: t('delete', { count: ids.length }),
    okText: t('deleteBtn'),
    cancelText: t('cancelDeletion'),
    onOk: () => {
      dispatch(core.transactions.remove(checkedIds))
      track('transaction_deleted', {
        mode: 'bulk',
        source: 'bulk_toolbar',
      })
      closeMenu()
      onUncheckAll()
    },
  })

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

  return (
    <>
      <BulkEditModal
        ids={checkedIds}
        onClose={() => setEditModalVisible(false)}
        onApply={() => {
          setEditModalVisible(false)
          closeMenu()
          onUncheckAll()
        }}
        open={editModalVisible}
      />
      <div
        style={{ transform: 'translateX(-50%)' }}
        className="absolute bottom-4 left-1/2 z-[1000]"
      >
        <CSSTransition
          nodeRef={actionsRef}
          mountOnEnter
          unmountOnExit
          in={visible}
          timeout={200}
          classNames="actions-transition"
        >
          <div
            ref={actionsRef}
            className="flex items-center rounded-[60px] bg-info pl-2 shadow-elevation-4"
          >
            <Chip
              label={t('selected', { count: ids.length })}
              onDelete={onUncheckAll}
              variant="outlined"
            />

            <Tooltip title={t('deleteSelected')}>
              <IconButton onClick={handleDelete}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>

            {actions.setMainTag && (
              <TagSelect2
                onChange={handleSetTag}
                trigger={
                  <Tooltip title={t('setCategory')}>
                    <IconButton children={<LocalOfferOutlinedIcon />} />
                  </Tooltip>
                }
              />
            )}

            <Tooltip title={t('actions')}>
              <IconButton
                children={<MoreVertIcon />}
                aria-haspopup="true"
                onClick={handleClick}
              />
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={closeMenu}
              placement="top-end"
              aria-label={t('actions')}
            >
              {actions.markViewed && (
                <MenuItem onClick={handleMarkViewed}>
                  <ListRowIcon>
                    <VisibilityIcon />
                  </ListRowIcon>
                  <ListRowText>{t('markViewed')}</ListRowText>
                </MenuItem>
              )}

              {actions.bulkEdit && (
                <MenuItem onClick={() => setEditModalVisible(true)}>
                  <ListRowIcon>
                    <EditIcon />
                  </ListRowIcon>
                  <ListRowText>{t('edit')}</ListRowText>
                </MenuItem>
              )}

              {actions.combineToOutcome && (
                <MenuItem
                  onClick={() => {
                    dispatch(core.transactions.combineToOutcome(ids))
                    track('transactions_combined', {
                      result_type: 'outcome',
                      source: 'bulk_toolbar',
                    })
                    onUncheckAll()
                  }}
                >
                  <ListRowIcon>
                    <MergeTypeIcon />
                  </ListRowIcon>
                  <ListRowText secondary={t('combineToOutcomeComment')}>
                    {t('combineToOutcome')}
                  </ListRowText>
                </MenuItem>
              )}

              {actions.combineToIncome && (
                <MenuItem
                  onClick={() => {
                    dispatch(core.transactions.combineToIncome(ids))
                    track('transactions_combined', {
                      result_type: 'income',
                      source: 'bulk_toolbar',
                    })
                    onUncheckAll()
                  }}
                >
                  <ListRowIcon>
                    <MergeTypeIcon />
                  </ListRowIcon>
                  <ListRowText secondary={t('combineToIncomeComment')}>
                    {t('combineToIncome')}
                  </ListRowText>
                </MenuItem>
              )}

              {actions.collapseTransactionsEasy && (
                <MenuItem onClick={handleDelete}>
                  <ListRowIcon>
                    <MergeTypeIcon />
                  </ListRowIcon>
                  <ListRowText secondary={t('mergeTransactionsComment')}>
                    {t('mergeTransactions')}
                  </ListRowText>
                </MenuItem>
              )}

              {actions.canMergeAsTransfer && (
                <MenuItem
                  onClick={() => {
                    dispatch(core.transactions.mergeAsTransfer(ids))
                    track('transactions_combined', {
                      result_type: 'transfer',
                      source: 'bulk_toolbar',
                    })
                    onUncheckAll()
                  }}
                >
                  <ListRowIcon>
                    <MergeTypeIcon />
                  </ListRowIcon>
                  <ListRowText secondary={t('mergeAsTransferComment')}>
                    {t('mergeAsTransfer')}
                  </ListRowText>
                </MenuItem>
              )}

              <div className="my-2">
                <Divider />
              </div>

              <MenuItem onClick={handleCheckAll}>
                <ListRowIcon>
                  <DoneAllIcon />
                </ListRowIcon>
                <ListRowText>{t('selectAll')}</ListRowText>
              </MenuItem>
            </Menu>
          </div>
        </CSSTransition>
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
    const accounts = new Set<string>()
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
