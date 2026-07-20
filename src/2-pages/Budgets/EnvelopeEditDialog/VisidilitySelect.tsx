import { core } from 'zerro-core/redux'
import { FC } from 'react'
import { MenuItem, SelectProps } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { SmartSelect } from '6-shared/ui/SmartSelect'

export const VisibilitySelect: FC<
  SelectProps<core.envelopes.envelopeVisibility>
> = props => {
  const { t } = useTranslation('envelopeEditDialog')
  return (
    <SmartSelect {...props} elKey="VisibilitySelect">
      <MenuItem value={core.envelopes.envelopeVisibility.auto}>
        {t('visibility.auto')}
      </MenuItem>
      <MenuItem value={core.envelopes.envelopeVisibility.visible}>
        {t('visibility.visible')}
      </MenuItem>
      <MenuItem value={core.envelopes.envelopeVisibility.hidden}>
        {t('visibility.hidden')}
      </MenuItem>
    </SmartSelect>
  )
}
