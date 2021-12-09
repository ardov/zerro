import React, { useState, FC } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Popover, TextField, PopoverProps } from '@mui/material'
import { getTagComment, setTagComment } from 'store/data/hiddenData/tagMeta'

// TODO: Unused component. Maybe delete later

export const CommentPopover: FC<PopoverProps & { id: string }> = props => {
  const { id, onClose, ...rest } = props
  const dispatch = useDispatch()
  const currentComment = useSelector(getTagComment(id))
  const [comment, setComment] = useState(currentComment)

  const save = () => {
    dispatch(setTagComment(id, comment))
    onClose?.({}, 'escapeKeyDown')
  }

  return (
    <>
      <Popover disableRestoreFocus onClose={save} {...rest}>
        <Box minWidth={296}>
          <TextField
            autoFocus
            multiline
            value={comment}
            onChange={e => setComment(e.target.value)}
            fullWidth
          />
        </Box>
      </Popover>
    </>
  )
}
