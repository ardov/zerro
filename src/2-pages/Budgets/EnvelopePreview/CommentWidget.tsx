import { FC, useState } from 'react'
import { InputBase, InputAdornment } from '@mui/material'
import { NotesIcon } from '6-shared/ui/Icons'
import { useAppDispatch, useAppSelector } from 'store'
import { cardStyle } from './shared'
import { core } from 'zerro-core/redux'

import { useDebouncedCallback } from '6-shared/hooks/useDebouncedCallback'
import { useTranslation } from 'react-i18next'

export const CommentWidget: FC<{ id: core.envelopes.TEnvelopeId }> = ({
  id,
}) => {
  const { t } = useTranslation('common')
  const dispatch = useAppDispatch()
  const comment = useAppSelector(s => core.envelopes.selectAll(s)[id].comment)
  const [value, setValue] = useState(comment)

  const applyChanges = useDebouncedCallback(
    value => {
      if (comment !== value) {
        dispatch(core.envelopes.setComment(id, value))
      }
    },
    [id, dispatch],
    300
  )

  const [prevComment, setPrevComment] = useState(comment)
  if (prevComment !== comment) {
    setPrevComment(comment)
    setValue(comment)
  }

  return (
    <InputBase
      sx={cardStyle}
      placeholder={t('comment')}
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
