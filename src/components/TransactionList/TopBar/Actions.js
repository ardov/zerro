import React, { useEffect, useState } from 'react'
import './transitions.css'
import { useSelector, useDispatch } from 'react-redux'
import IconButton from '@material-ui/core/IconButton'
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline'
import LocalOfferOutlinedIcon from '@material-ui/icons/LocalOfferOutlined'
import DoneAllIcon from '@material-ui/icons/DoneAll'
import { Tooltip } from 'components/Tooltip'
import { makeStyles } from '@material-ui/styles'
import Chip from '@material-ui/core/Chip'
import Box from '@material-ui/core/Box'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import VisibilityIcon from '@material-ui/icons/Visibility'
import pluralize from 'helpers/pluralize'
import { Confirm } from 'components/Confirm'
import TagSelect2 from 'components/TagSelect2'
import {
  deleteTransactions,
  markViewed,
  bulkEditTransactions,
} from 'store/localData/transactions/thunks'
import { CSSTransition } from 'react-transition-group'
import { EditOutlined } from '@material-ui/icons'
import { BulkEditModal } from './BulkEditModal'
import { getType, isNew } from 'store/localData/transactions/helpers'
import { getTransactions } from 'store/localData/transactions'
import { Divider } from '@material-ui/core'

export default function Actions({
  visible,
  checkedIds,
  onUncheckAll,
  onCheckAll,
  onDelete,
}) {
  const dispatch = useDispatch()
  const classes = useStyles()
  const allTransactions = useSelector(getTransactions)
  const [ids, setIds] = useState(checkedIds)
  const transactions = ids?.map(id => allTransactions[id])
  const actions = getAvailableActions(transactions)
  const length = ids.length
  const [editModalVisible, setEditModalVisible] = useState(false)

  const [anchorEl, setAnchorEl] = useState(null)
  const handleClick = event => setAnchorEl(event.currentTarget)
  const closeMenu = () => setAnchorEl(null)

  useEffect(() => {
    if (visible) setIds(checkedIds)
  }, [visible, checkedIds])

  const handleSetTag = id => {
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
                  <VisibilityIcon className={classes.menuIcon} color="action" />
                  Сделать просмотренными
                </MenuItem>
              )}

              {actions.bulkEdit && (
                <MenuItem onClick={() => setEditModalVisible(true)}>
                  <EditOutlined className={classes.menuIcon} color="action" />
                  Редактировать
                </MenuItem>
              )}

              <Box my={1}>
                <Divider />
              </Box>

              <MenuItem onClick={handleCheckAll}>
                <DoneAllIcon className={classes.menuIcon} color="action" />
                Выбрать все
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

function getAvailableActions(transactions) {
  const { income, outcome, transfer } = getTypes(transactions)
  return {
    delete: true,
    setMainTag: !transfer && (income || outcome),
    bulkEdit: true,
    markViewed: transactions.some(isNew),
  }
}

function getTypes(list = []) {
  let res = { income: 0, outcome: 0, transfer: 0 }
  list?.forEach(tr => res[getType(tr)]++)
  return res
}
