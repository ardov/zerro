import type { TTransaction } from '6-shared/types'
import {
  currency as coreCurrency,
  instruments as coreInstruments,
  transactions as coreTransactions,
} from 'zerro-core/redux'

import React, { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CSSTransition } from 'react-transition-group'
import { EditOutlined } from '@mui/icons-material'
import {
  Box,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Menu,
} from '@mui/material'
import {
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

import { TagSelect2 } from '5-entities/tag/ui/TagSelect2'
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
  const allTransactions = useAppSelector(coreTransactions.selectAll)
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
      dispatch(coreTransactions.bulkEdit(checkedIds, { tags: [] }))
    else dispatch(coreTransactions.bulkEdit(checkedIds, { tags: [id] }))
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
      dispatch(coreTransactions.remove(checkedIds))
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
    dispatch(coreTransactions.setViewed(checkedIds, true))
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
      <Box
        style={{ transform: 'translateX(-50%)' }}
        sx={{
          position: 'absolute',
          left: '50%',
          bottom: 16,
          zIndex: 1000,
        }}
      >
        <CSSTransition
          mountOnEnter
          unmountOnExit
          in={visible}
          timeout={200}
          classNames="actions-transition"
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 1,
              bgcolor: 'info.main',
              boxShadow: '4',
              borderRadius: '60px',
            }}
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
                aria-controls="actions-menu"
                aria-haspopup="true"
                onClick={handleClick}
              />
            </Tooltip>

            <Menu
              id="actions-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={closeMenu}
              anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
              transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {actions.markViewed && (
                <MenuItem onClick={handleMarkViewed}>
                  <ListItemIcon>
                    <VisibilityIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('markViewed')} />
                </MenuItem>
              )}

              {actions.bulkEdit && (
                <MenuItem onClick={() => setEditModalVisible(true)}>
                  <ListItemIcon>
                    <EditOutlined />
                  </ListItemIcon>
                  <ListItemText primary={t('edit')} />
                </MenuItem>
              )}

              {actions.combineToOutcome && (
                <MenuItem
                  onClick={() => {
                    dispatch(coreTransactions.combineToOutcome(ids))
                    track('transactions_combined', {
                      result_type: 'outcome',
                      source: 'bulk_toolbar',
                    })
                    onUncheckAll()
                  }}
                >
                  <ListItemIcon>
                    <MergeTypeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('combineToOutcome')}
                    secondary={t('combineToOutcomeComment')}
                  />
                </MenuItem>
              )}

              {actions.combineToIncome && (
                <MenuItem
                  onClick={() => {
                    dispatch(coreTransactions.combineToIncome(ids))
                    track('transactions_combined', {
                      result_type: 'income',
                      source: 'bulk_toolbar',
                    })
                    onUncheckAll()
                  }}
                >
                  <ListItemIcon>
                    <MergeTypeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('combineToIncome')}
                    secondary={t('combineToIncomeComment')}
                  />
                </MenuItem>
              )}

              {actions.collapseTransactionsEasy && (
                <MenuItem onClick={handleDelete}>
                  <ListItemIcon>
                    <MergeTypeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('mergeTransactions')}
                    secondary={t('mergeTransactionsComment')}
                  />
                </MenuItem>
              )}

              {actions.canMergeAsTransfer && (
                <MenuItem
                  onClick={() => {
                    dispatch(coreTransactions.mergeAsTransfer(ids))
                    track('transactions_combined', {
                      result_type: 'transfer',
                      source: 'bulk_toolbar',
                    })
                    onUncheckAll()
                  }}
                >
                  <ListItemIcon>
                    <MergeTypeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('mergeAsTransfer')}
                    secondary={t('mergeAsTransferComment')}
                  />
                </MenuItem>
              )}

              <Box sx={{ my: 1 }}>
                <Divider />
              </Box>

              <MenuItem onClick={handleCheckAll}>
                <ListItemIcon>
                  <DoneAllIcon />
                </ListItemIcon>
                <ListItemText primary={t('selectAll')} />
              </MenuItem>
            </Menu>
          </Box>
        </CSSTransition>
      </Box>
    </>
  )
}

function getAvailableActions(transactions: TTransaction[]) {
  const { incomes, outcomes, transfers } = groupByType(transactions)
  const instCodeMap = coreInstruments.useCodeMap()
  const toDisplay = coreCurrency.useToDisplay('current')

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
    markViewed: transactions.some(tr => !coreTransactions.isViewed(tr)),
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
    const trType = coreTransactions.getType(tr)
    if (trType === 'income') incomes.push(tr)
    if (trType === 'outcome') outcomes.push(tr)
    if (trType === 'transfer') transfers.push(tr)
  })

  return { incomes, outcomes, transfers }
}

export default Actions
