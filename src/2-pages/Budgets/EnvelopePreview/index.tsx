import { IconButton } from '@/6-shared/ui/kit/Button'
import type { FC, MouseEvent } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TagIcon } from '@/6-shared/ui/TagIcon'
import { CloseIcon, EditIcon } from '@/6-shared/ui/Icons'
import { ColorPicker } from '@/3-widgets/ColorPicker'
import { useAsk } from '@/6-shared/overlays'
import { track } from '@/6-shared/analytics'
// import { usePopover } from '@shared/ui/PopoverManager'

import { useAppDispatch, useAppSelector } from '@/store'
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
  const { symbol, colorHex: color, name } = envelope
  const { t } = useTranslation('common')
  const openEditDialog = useEditDialog()
  const dispatch = useAppDispatch()
  const ask = useAsk()
  const openColorPicker = useCallback(
    async (e: MouseEvent<HTMLElement>) => {
      const hex = await ask<string | null>(
        <ColorPicker value={color} anchorEl={e.currentTarget} />
      )
      if (hex === undefined) return
      track('envelope_color_changed', {})
      dispatch(core.envelopes.setColor(envelope.id, hex))
    },
    [ask, color, dispatch, envelope.id]
  )
  return (
    <header className="sticky top-0 z-[5] flex items-center bg-ui-card px-6 py-2">
      <div className="flex min-w-0 grow items-center">
        <TagIcon
          size="m"
          symbol={symbol}
          className="mr-4 shrink-0"
          color={color}
          onClick={openColorPicker}
          button
        />
        <h2 className="m-0 truncate text-title">{name}</h2>
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
