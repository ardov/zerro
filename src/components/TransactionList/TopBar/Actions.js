import React from 'react'
import './transitions.css'
import { useDispatch } from 'react-redux'
import IconButton from '@material-ui/core/IconButton'
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline'
import LocalOfferOutlinedIcon from '@material-ui/icons/LocalOfferOutlined'
import { Tooltip } from 'components/Tooltip'
import Chip from '@material-ui/core/Chip'
import Box from '@material-ui/core/Box'
import pluralize from 'helpers/pluralize'
import Confirm from 'components/Confirm'
import TagSelect2 from 'components/TagSelect2'
import {
  setMainTagToTransactions,
  deleteTransactions,
} from 'store/localData/transactions/thunks'
import { CSSTransition } from 'react-transition-group'

export default function Actions({
  visible,
  checkedIds,
  onUncheckAll,
  onDelete,
}) {
  const dispatch = useDispatch()
  const length = checkedIds.length

  const handleSetTag = id => {
    dispatch(setMainTagToTransactions(checkedIds, id))
    onUncheckAll()
  }

  const handleDelete = () => {
    dispatch(deleteTransactions(checkedIds))
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
    <Box
      position="absolute"
      bottom={16}
      left="50%"
      style={{ transform: 'translateX(-50%)' }}
      zIndex={1000}
    >
      <CSSTransition
        mountOnEnter
        in={visible}
        timeout={0}
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

          <TagSelect2
            onChange={handleSetTag}
            trigger={
              <Tooltip title="Выставить категорию">
                <IconButton children={<LocalOfferOutlinedIcon />} />
              </Tooltip>
            }
          />
        </Box>
      </CSSTransition>
    </Box>
  )
}
