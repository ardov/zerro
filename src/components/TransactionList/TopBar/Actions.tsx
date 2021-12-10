import React, { FC, useEffect, useState } from 'react'
import './transitions.css'
import { useSelector, useDispatch } from 'react-redux'
import IconButton from '@mui/material/IconButton'
import {
  DeleteOutlineIcon,
  LocalOfferOutlinedIcon,
  DoneAllIcon,
  MoreVertIcon,
  VisibilityIcon,
  MergeTypeIcon,
} from 'components/Icons'
import { Tooltip } from 'components/Tooltip'
import { makeStyles } from '@mui/styles'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import pluralize from 'helpers/pluralize'
import { Confirm } from 'components/Confirm'
import TagSelect2 from 'components/TagSelect2'
import {
  deleteTransactions,
  markViewed,
  bulkEditTransactions,
} from 'store/data/transactions/thunks'
import { CSSTransition } from 'react-transition-group'
import { EditOutlined } from '@mui/icons-material'
import { BulkEditModal } from './BulkEditModal'
import { getType, isNew } from 'store/data/transactions/helpers'
import { getTransactions } from 'store/data/transactions'
import { Divider, ListItemIcon, ListItemText } from '@mui/material'
import { Transaction } from 'types'
import { round } from 'helpers/currencyHelpers'
import { applyClientPatch } from 'store/data'
import { sendEvent } from 'helpers/tracking'

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
  const dispatch = useDispatch()
  const classes = useStyles()
  const allTransactions = useSelector(getTransactions)
  const [ids, setIds] = useState(checkedIds)
  const transactions = ids?.map(id => allTransactions[id])
  const actions = getAvailableActions(transactions)
  const length = ids.length
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
      dispatch(bulkEditTransactions(checkedIds, { tags: [] }))
    else dispatch(bulkEditTransactions(checkedIds, { tags: [id] }))
    closeMenu()
    onUncheckAll()
  }

  const handleDelete = () => {
    dispatch(deleteTransactions(checkedIds))
    closeMenu()
    onUncheckAll()
  }

  const handleCheckAll = () => {
    onCheckAll()
    closeMenu()
  }

  const handleMarkViewed = () => {
    dispatch(markViewed(checkedIds, true))
    closeMenu()
    onUncheckAll()
  }

  const chipText =
    pluralize(length, ['Выбрана', 'Выбрано', 'Выбрано']) +
    ` ${length} ` +
    pluralize(length, ['операция', 'операции', 'операций'])

  const deleteText = `Удалить ${length} ${pluralize(length, [
    'операцию',
    'операции',
    'операций',
  ])}?`

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
            <Chip label={chipText} onDelete={onUncheckAll} variant="outlined" />

            <Confirm
              title={deleteText}
              onOk={handleDelete}
              okText="Удалить"
              cancelText="Оставить"
            >
              <Tooltip title="Удалить выбранные">
                <IconButton children={<DeleteOutlineIcon />} />
              </Tooltip>
            </Confirm>

            {actions.setMainTag && (
              <TagSelect2
                onChange={handleSetTag}
                trigger={
                  <Tooltip title="Выставить категорию">
                    <IconButton children={<LocalOfferOutlinedIcon />} />
                  </Tooltip>
                }
              />
            )}

            <Tooltip title="Действия">
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
                  <ListItemText primary="Сделать просмотренными" />
                </MenuItem>
              )}

              {actions.bulkEdit && (
                <MenuItem onClick={() => setEditModalVisible(true)}>
                  <ListItemIcon>
                    <EditOutlined />
                  </ListItemIcon>
                  <ListItemText primary="Редактировать" />
                </MenuItem>
              )}

              {actions.combineReturns && (
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
                    primary="Объединить в расход"
                    secondary="Возвраты станут переводами или удалятся"
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
                <ListItemText primary="Выбрать все" />
              </MenuItem>
            </Menu>
          </Box>
        </CSSTransition>
      </Box>
    </>
  )
}

const useStyles = makeStyles(({ spacing }) => ({
  menuIcon: { marginRight: spacing(1) },
}))

function getAvailableActions(transactions: Transaction[]) {
  const { incomes, outcomes, transfers } = getTypes(transactions)
  return {
    delete: true,
    setMainTag: !transfers.length && (incomes.length || outcomes.length),
    bulkEdit: true,
    markViewed: transactions.some(isNew),
    combineReturns: showCombineReturns(),
  }

  function showCombineReturns(): boolean {
    if (outcomes.length !== 1) return false
    if (incomes.length === 0) return false
    if (transfers.length > 0) return false

    const instrument = outcomes[0].outcomeInstrument
    if (incomes.some(tr => tr.incomeInstrument !== instrument)) return false

    const totalOutcome = outcomes[0].outcome
    const totalIncome = incomes
      .map(tr => tr.income)
      .reduce((sum, v) => round(sum + v), 0)
    if (totalOutcome <= totalIncome) return false
    return true
  }
}

function combineToOutcome(transactions: Transaction[]) {
  const { incomes, outcomes } = getTypes(transactions)
  const outcome = outcomes[0]
  const outcomeInstrument = outcome.outcomeInstrument
  let outcomeSum = outcome.outcome
  const outcomeAccount = outcome.outcomeAccount
  const modifiedIncomes: Transaction[] = incomes.map(tr => {
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

function getTypes(list: Transaction[] = []) {
  let incomes: Transaction[] = []
  let outcomes: Transaction[] = []
  let transfers: Transaction[] = []

  list?.forEach(tr => {
    let trType = getType(tr)
    if (trType === 'income') incomes.push(tr)
    if (trType === 'outcome') outcomes.push(tr)
    if (trType === 'transfer') transfers.push(tr)
  })

  return { incomes, outcomes, transfers }
}

export default Actions
