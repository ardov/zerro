import React, { FC } from 'react'
import { MenuItem, SelectProps } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { SmartSelect } from '6-shared/ui/SmartSelect'
import { envelopeVisibility } from '5-entities/envelope'

export const VisibilitySelect: FC<SelectProps<envelopeVisibility>> = props => {
  const { t } = useTranslation('envelopeEditDialog')
  return (
    <SmartSelect {...props} elKey="VisibilitySelect">
      <MenuItem value={envelopeVisibility.auto}>
        {t('visibility.auto')}
      </MenuItem>
      <MenuItem value={envelopeVisibility.visible}>
        {t('visibility.visible')}
      </MenuItem>
      <MenuItem value={envelopeVisibility.hidden}>
        {t('visibility.hidden')}
      </MenuItem>
    </SmartSelect>
  )
}
