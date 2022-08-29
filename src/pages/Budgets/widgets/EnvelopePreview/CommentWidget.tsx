import React, { FC, useEffect, useState } from 'react'
import { InputBase, InputAdornment } from '@mui/material'
import { NotesIcon } from '@shared/ui/Icons'
import { useDebounce } from '@shared/hooks/useDebounce'
import { TEnvelopeId, TISOMonth } from '@shared/types'
import { useAppDispatch } from '@store'
import { useEnvelope } from '@models/envelopeData'
import { cardStyle } from './shared'
import { patchEnvelope } from '@models/envelope'

export const CommentWidget: FC<{ month: TISOMonth; id: TEnvelopeId }> = ({
  month,
  id,
}) => {
  const envelope = useEnvelope(month, id)
  const dispatch = useAppDispatch()
  const comment = envelope.comment
  const [value, setValue] = useState(comment)
  const debouncedValue = useDebounce(value, 300)

  // Update comment only when debounced value updated
  useEffect(() => {
    if (comment !== debouncedValue) {
      dispatch(patchEnvelope({ id, comment: debouncedValue }))
    }
  }, [debouncedValue, dispatch, id, comment])

  return (
    <InputBase
      sx={cardStyle}
      placeholder="Комментарий"
      value={value}
      onChange={e => setValue(e.target.value)}
      multiline
      startAdornment={
        <InputAdornment position="start" component="label">
          <NotesIcon />
        </InputAdornment>
      }
    />
  )
}
