import { core } from '@/zerro-core/redux'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@/6-shared/ui/kit/Select'

type VisibilitySelectProps = {
  value: core.envelopes.envelopeVisibility
  onChange: (value: core.envelopes.envelopeVisibility) => void
  label: string
  className?: string
}

export const VisibilitySelect: FC<VisibilitySelectProps> = props => {
  const { t } = useTranslation('envelopeEditDialog')
  const { value, onChange, ...rest } = props
  const visibility = core.envelopes.envelopeVisibility
  return (
    <Select
      {...rest}
      required
      value={value}
      labelMode="floating"
      onChange={onChange}
      items={[
        { value: visibility.auto, label: t('visibility.auto') },
        { value: visibility.visible, label: t('visibility.visible') },
        { value: visibility.hidden, label: t('visibility.hidden') },
      ]}
    />
  )
}
