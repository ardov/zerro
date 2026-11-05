import { TextFade } from '@/6-shared/ui/kit/TextFade'
import { IconButton } from '@/6-shared/ui/kit/Button'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { CloseIcon, EditIcon } from '@/6-shared/ui/Icons'
import { AppearancePicker } from '@/3-widgets/AppearancePicker'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'

import { useMonth } from '../MonthProvider'
import { EnvelopeEditDialog, useEditDialog } from '../EnvelopeEditDialog'
import { ActivityWidget } from './ActivityWidget'
import { CommentWidget } from './CommentWidget'
import { GoalWidget } from './GoalWidget'
import { BurndownWidget } from './BurndownWidget'
import { EnvelopeInfo } from './EnvelopeInfo'
import { StatisticWidget } from './StatisticWidget'

type EnvelopePreviewProps = {
  id: core.envelopes.TEnvelopeId
  onClose: () => void
}

export const EnvelopePreview: FC<EnvelopePreviewProps> = ({ onClose, id }) => {
  const [month] = useMonth()

  const envMetrics = useAppSelector(core.activity.selectEnvelopeMetrics)[month][
    id
  ]
  const env = useAppSelector(core.envelopes.selectAll)[id]
  if (!envMetrics) return null

  const { currency } = envMetrics

  return (
    <div className="relative">
      <Header envelope={env} onClose={onClose} />
      <div className="grid gap-4 px-6 pb-10 pt-6">
        <CommentWidget key={id} id={id} />

        <GoalWidget id={id} currency={currency} />

        <EnvelopeInfo month={month} id={id} />

        <BurndownWidget id={id} />

        <ActivityWidget id={id} />

        <StatisticWidget id={id} />
      </div>
    </div>
  )
}

const Header: FC<{
  envelope: core.envelopes.TPresentedEnvelope
  onClose: () => void
}> = ({ envelope, onClose }) => {
  const { name } = envelope
  const { t } = useTranslation('common')
  const openEditDialog = useEditDialog()
  return (
    <header className="sticky top-0 z-[5] flex items-center bg-ui-card px-6 py-2">
      <div className="flex min-w-0 grow items-center gap-4">
        <AppearancePicker envelope={envelope} size="m" />
        <TextFade render={<h2 />} className="m-0 text-title">
          {name}
        </TextFade>
      </div>
      <IconButton
        variant="ghost"
        size="sm"
        label={t('edit')}
        onClick={() => openEditDialog(envelope.id)}
        children={<EditIcon />}
      />

      <IconButton
        variant="ghost"
        size="sm"
        label={t('close')}
        onClick={onClose}
        children={<CloseIcon />}
      />

      <EnvelopeEditDialog />
    </header>
  )
}
