import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline'
import LocalOfferOutlinedIcon from '@material-ui/icons/LocalOfferOutlined'
import Tooltip from '@material-ui/core/Tooltip'
import Chip from '@material-ui/core/Chip'
import Box from '@material-ui/core/Box'
import pluralize from 'helpers/pluralize'
import Confirm from 'components/Confirm'
import TagSelect2 from 'components/TagSelect2'

export default function Actions({ selectedIds, setTags, uncheckAll, ...rest }) {
  return (
    <Box {...rest}>
      <Chip
        label={`${pluralize(selectedIds.length, [
          'Выбрана',
          'Выбрано',
          'Выбрано',
        ])} ${selectedIds.length} ${pluralize(selectedIds.length, [
          'операция',
          'операции',
          'операций',
        ])}`}
        onDelete={uncheckAll}
      />

      <Confirm
        title={`Удалить ${selectedIds.length} ${pluralize(selectedIds.length, [
          'операцию',
          'операции',
          'операций',
        ])}?`}
        onOk={() => console.log('OK')}
        okText="Удалить"
        cancelText="Оставить"
      >
        <Tooltip title="Удалить выбранные">
          <IconButton children={<DeleteOutlineIcon />} />
        </Tooltip>
      </Confirm>

      <Box ml={1} clone>
        <TagSelect2
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
