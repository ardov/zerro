import { core } from 'zerro-core/redux'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '6-shared/ui/Select'

type VisibilitySelectProps = {
  value: core.envelopes.envelopeVisibility
  onChange: (value: core.envelopes.envelopeVisibility) => void
  label?: string
  className?: string
}

export const VisibilitySelect: FC<VisibilitySelectProps> = props => {
  const { t } = useTranslation('envelopeEditDialog')
  const { value, onChange, ...rest } = props
  const items = {
    [core.envelopes.envelopeVisibility.auto]: t('visibility.auto'),
    [core.envelopes.envelopeVisibility.visible]: t('visibility.visible'),
    [core.envelopes.envelopeVisibility.hidden]: t('visibility.hidden'),
  }
  return (
    <Select
      {...rest}
      elKey="VisibilitySelect"
      items={items}
      value={value}
      onChange={next => onChange(next as core.envelopes.envelopeVisibility)}
    />
  )
}
