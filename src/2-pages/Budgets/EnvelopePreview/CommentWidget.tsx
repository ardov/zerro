import { FC, useEffect, useState } from 'react'
import { InputBase, InputAdornment } from '@mui/material'
import { NotesIcon } from '6-shared/ui/Icons'
import { useAppDispatch, useAppSelector } from 'store'
import { cardStyle } from './shared'
import { TEnvelopeId } from '5-entities/envelope'
import { envelopes as coreEnvelopes } from 'zerro-core/redux'

import { useDebouncedCallback } from '6-shared/hooks/useDebouncedCallback'
import { useTranslation } from 'react-i18next'

export const CommentWidget: FC<{ id: TEnvelopeId }> = ({ id }) => {
  const { t } = useTranslation('common')
  const dispatch = useAppDispatch()
  const comment = useAppSelector(s => coreEnvelopes.selectAll(s)[id].comment)
  const [value, setValue] = useState(comment)

  const applyChanges = useDebouncedCallback(
    value => {
      if (comment !== value) {
        dispatch(coreEnvelopes.setComment(id, value))
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
