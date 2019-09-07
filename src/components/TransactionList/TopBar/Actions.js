import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline'
import Tooltip from '@material-ui/core/Tooltip'
import Chip from '@material-ui/core/Chip'
import Box from '@material-ui/core/Box'
import pluralize from 'helpers/pluralize'
import Confirm from './Confirm'

export default function Actions({ selectedIds, setTags, uncheckAll, ...rest }) {
  const [isConfirmOpen, setConfirmOpen] = React.useState(false)
  const showConfirm = () => setConfirmOpen(true)
  const hideConfirm = () => setConfirmOpen(false)

  return (
    <Box {...rest}>
      <Chip
        label={`${selectedIds.length} ${pluralize(selectedIds.length, [
          'операция',
          'операции',
          'операций',
        ])}`}
        onDelete={uncheckAll}
      />
      <Tooltip title="Удалить выбранные">
        <IconButton onClick={showConfirm} children={<DeleteOutlineIcon />} />
      </Tooltip>

      <Confirm
        open={isConfirmOpen}
        onCancel={hideConfirm}
        title={`Удалить ${selectedIds.length} ${pluralize(selectedIds.length, [
          'операцию',
          'операции',
          'операций',
        ])}?`}
        okColor="error"
        okText="Удалить"
      ></Confirm>
    </Box>
  )
}
