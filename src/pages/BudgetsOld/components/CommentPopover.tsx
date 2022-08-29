import React, { useState, FC } from 'react'
import { useAppDispatch, useAppSelector } from '@store'
import { Box, Popover, TextField, PopoverProps } from '@mui/material'
import { getTagComment, setTagComment } from '@models/hiddenData/tagMeta'

// TODO: Unused component. Maybe delete later

export const CommentPopover: FC<PopoverProps & { id: string }> = props => {
  const { id, onClose, ...rest } = props
  const dispatch = useAppDispatch()
  const currentComment = useAppSelector(getTagComment(id))
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
