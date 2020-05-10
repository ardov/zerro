import React from 'react'
import { connect } from 'react-redux'
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

export function Actions({ checkedIds, onUncheckAll, onSetTag, onDelete }) {
  const length = checkedIds.length

  const handleSetTag = id => {
    onSetTag(id)
    onUncheckAll()
  }

  const handleDelete = () => {
    onDelete()
    onUncheckAll()
  }

  const chipText = `${pluralize(length, [
    'Выбрана',
    'Выбрано',
    'Выбрано',
  ])} ${length} ${pluralize(length, ['операция', 'операции', 'операций'])}`

  const deleteText = `Удалить ${length} ${pluralize(length, [
    'операцию',
    'операции',
    'операций',
  ])}?`

  return (
    <Box>
      <Chip label={chipText} onDelete={onUncheckAll} />

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

      <Box ml={1} clone>
        <TagSelect2
          onChange={handleSetTag}
          trigger={
            <Tooltip title="Выставить категорию">
              <IconButton children={<LocalOfferOutlinedIcon />} />
            </Tooltip>
          }
        />
      </Box>
    </Box>
  )
}

const mapDispatchToProps = (dispatch, props) => ({
  onSetTag: tagId =>
    dispatch(setMainTagToTransactions(props.checkedIds, tagId)),
  onDelete: () => dispatch(deleteTransactions(props.checkedIds)),
})

export default connect(null, mapDispatchToProps)(Actions)
