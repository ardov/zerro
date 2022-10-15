import React, { FC, useEffect, useState } from 'react'
import { InputBase, InputAdornment } from '@mui/material'
import { NotesIcon } from '@shared/ui/Icons'
import { TEnvelopeId, TISOMonth } from '@shared/types'
import { useAppDispatch } from '@store'
import { useEnvelope } from '@entities/envelopeData'
import { cardStyle } from './shared'
import { patchEnvelope } from '@entities/envelope'
import { useDebouncedCallback } from '@shared/hooks/useDebouncedCallback'

export const CommentWidget: FC<{ month: TISOMonth; id: TEnvelopeId }> = ({
  month,
  id,
}) => {
  const dispatch = useAppDispatch()
  const envelope = useEnvelope(month, id)
  const comment = envelope.env.comment
  const [value, setValue] = useState(comment)

  const applyChanges = useDebouncedCallback(
    value => {
      if (comment !== value) {
        dispatch(patchEnvelope({ id, comment: value }))
      }
    },
    [id, dispatch],
    300
  )

  useEffect(() => {
    setValue(comment)
  }, [comment])

  return (
    <InputBase
      sx={cardStyle}
      placeholder="Комментарий"
      value={value}
      onChange={e => {
        setValue(e.target.value)
        applyChanges(e.target.value)
      }}
      multiline
      startAdornment={
        <InputAdornment position="start" component="label">
          <NotesIcon />
        </InputAdornment>
      }
    />
  )
}
