import React, { FC } from 'react'
import { MenuItem, SelectProps } from '@mui/material'
import { envelopeVisibility } from '5-entities/envelope'
import { SmartSelect } from '6-shared/ui/SmartSelect'

export const VisibilitySelect: FC<SelectProps<envelopeVisibility>> = props => {
  return (
    <SmartSelect {...props} elKey="VisibilitySelect">
      <MenuItem value={envelopeVisibility.auto}>Автоматически</MenuItem>
      <MenuItem value={envelopeVisibility.visible}>Всегда показывать</MenuItem>
      <MenuItem value={envelopeVisibility.hidden}>Всегда скрывать</MenuItem>
    </SmartSelect>
  )
}
