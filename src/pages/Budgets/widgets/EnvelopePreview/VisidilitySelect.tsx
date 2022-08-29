import React, { FC } from 'react'
import { Select, MenuItem, SelectProps } from '@mui/material'
import { envelopeVisibility } from '@models/envelope'

export const VisibilitySelect: FC<SelectProps<envelopeVisibility>> = props => {
  return (
    <Select {...props}>
      <MenuItem value={envelopeVisibility.auto}>Автоматически</MenuItem>
      <MenuItem value={envelopeVisibility.visible}>Всегда показывать</MenuItem>
      <MenuItem value={envelopeVisibility.hidden}>Всегда скрывать</MenuItem>
    </Select>
  )
}
