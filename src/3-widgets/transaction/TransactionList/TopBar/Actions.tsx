import type { TTransaction } from '6-shared/types'
import React, { FC, useEffect, useState } from 'react'
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
import { round } from '6-shared/helpers/money'
import { sendEvent } from '6-shared/helpers/tracking'
import { useConfirm } from '6-shared/ui/SmartConfirm'
import { useAppDispatch } from 'store'
import { applyClientPatch } from 'store/data'
import { TagSelect2 } from '5-entities/tag/ui/TagSelect2'
import { trModel } from '5-entities/transaction'
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
  const allTransactions = trModel.useTransactions()
  const [ids, setIds] = useState(checkedIds)
  const transactions = ids?.map(id => allTransactions[id])
  const actions = getAvailableActions(transactions)
  const [editModalVisible, setEditModalVisible] = useState(false)

  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  const handleClick: React.MouseEventHandler = event =>
    setAnchorEl(event.currentTarget)
  const closeMenu = () => setAnchorEl(null)

  useEffect(() => {
    if (visible) setIds(checkedIds)
  }, [visible, checkedIds])

  const handleSetTag = (id: string) => {
    if (!id || id === 'null')
      dispatch(trModel.bulkEditTransactions(checkedIds, { tags: [] }))
    else dispatch(trModel.bulkEditTransactions(checkedIds, { tags: [id] }))
    closeMenu()
    onUncheckAll()
  }

  const handleDelete = useConfirm({
    title: t('delete', { count: ids.length }),
    okText: t('deleteBtn'),
    cancelText: t('cancelDeletion'),
    onOk: () => {
      dispatch(trModel.deleteTransactions(checkedIds))
      closeMenu()
      onUncheckAll()
    },
  })

  const handleCheckAll = () => {
    onCheckAll()
    closeMenu()
  }

  const handleMarkViewed = () => {
    dispatch(trModel.markViewed(checkedIds, true))
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
        position="absolute"
        left="50%"
        bottom={16}
        style={{ transform: 'translateX(-50%)' }}
        zIndex={1000}
      >
        <CSSTransition
          mountOnEnter
          unmountOnExit
          in={visible}
          timeout={200}
          classNames="actions-transition"
        >
          <Box
            display="flex"
            alignItems="center"
            paddingLeft={1}
            bgcolor="info.main"
            boxShadow="4"
            borderRadius="60px"
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
                    sendEvent('Transaction: combine to outcome')
                    dispatch(
                      applyClientPatch({
                        transaction: combineToOutcome(transactions),
                      })
                    )
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
                    sendEvent('Transaction: combine to income')
                    dispatch(
                      applyClientPatch({
                        transaction: combineToIncome(transactions),
                      })
                    )
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

              <Box my={1}>
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
  const { incomes, outcomes, transfers } = getTypes(transactions)
  const totalOutcome = outcomes.reduce((sum, tr) => round(sum + tr.outcome), 0)
  const totalIncome = incomes.reduce((sum, tr) => round(sum + tr.income), 0)
  const sameInstruments = hasSameInOutInstruments()
  const sameAccounts = hasSameInOutAccounts()

  return {
    delete: true,
    setMainTag: !transfers.length && (incomes.length || outcomes.length),
    bulkEdit: true,
    markViewed: transactions.some(tr => !trModel.isViewed(tr)),
    combineToOutcome: canCombineToOutcome(),
    combineToIncome: canCombineToIncome(),
    collapseTransactionsEasy: canCollapseTransactionsEasy(),
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

  // TODO: add function to delete transactions and convert some of them to transfers
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

function combineToOutcome(transactions: TTransaction[]) {
  const { incomes, outcomes } = getTypes(transactions)
  const outcome = outcomes[0]
  const outcomeInstrument = outcome.outcomeInstrument
  let outcomeSum = outcome.outcome
  const outcomeAccount = outcome.outcomeAccount
  const modifiedIncomes: TTransaction[] = incomes.map(tr => {
    outcomeSum = round(outcomeSum - tr.income)
    if (tr.incomeAccount === outcomeAccount) {
      // Same account -> just delete income
      return {
        ...tr,
        changed: Date.now(),
        deleted: true,
      }
    } else {
      // Other account -> convert to transfer
      return {
        ...tr,
        changed: Date.now(),
        outcomeAccount,
        outcome: tr.income,
        outcomeInstrument,
      }
    }
  })
  modifiedIncomes.push({
    ...outcome,
    outcome: outcomeSum,
    changed: Date.now(),
  })
  return modifiedIncomes
}

function combineToIncome(transactions: TTransaction[]) {
  const { incomes, outcomes } = getTypes(transactions)
  const income = incomes[0]
  const incomeInstrument = income.incomeInstrument
  let incomeSum = income.income
  const incomeAccount = income.incomeAccount
  const modifiedOutcomes: TTransaction[] = outcomes.map(tr => {
    incomeSum = round(incomeSum - tr.outcome)
    if (tr.outcomeAccount === incomeAccount) {
      // Same account -> just delete outcome
      return {
        ...tr,
        changed: Date.now(),
        deleted: true,
      }
    } else {
      // Other account -> convert to transfer
      return {
        ...tr,
        changed: Date.now(),
        incomeAccount,
        income: tr.outcome,
        incomeInstrument,
      }
    }
  })
  modifiedOutcomes.push({
    ...income,
    income: incomeSum,
    changed: Date.now(),
  })
  return modifiedOutcomes
}

function getTypes(list: TTransaction[] = []) {
  let incomes: TTransaction[] = []
  let outcomes: TTransaction[] = []
  let transfers: TTransaction[] = []

  list?.forEach(tr => {
    let trType = trModel.getType(tr)
    if (trType === 'income') incomes.push(tr)
    if (trType === 'outcome') outcomes.push(tr)
    if (trType === 'transfer') transfers.push(tr)
  })

  return { incomes, outcomes, transfers }
}

export default Actions
