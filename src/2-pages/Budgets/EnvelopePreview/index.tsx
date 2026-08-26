import type { FC } from 'react'
import { useCallback } from 'react'
import { Typography, IconButton, ButtonBase } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { TagIcon } from '6-shared/ui/TagIcon'
import { Tooltip } from '6-shared/ui/Tooltip'
import { CloseIcon, EditIcon, EmojiFlagsIcon } from '6-shared/ui/Icons'
import { ColorPicker, useColorPicker } from '6-shared/ui/ColorPickerPopover'
import { track } from '6-shared/analytics'
// import { usePopover } from '@shared/ui/PopoverManager'

import { useAppDispatch, useAppSelector } from 'store'
import { core } from 'zerro-core/redux'

import { useMonth } from '../MonthProvider'
import { EnvelopeEditDialog, useEditDialog } from '../EnvelopeEditDialog'
import { ActivityWidget } from './ActivityWidget'
import { CommentWidget } from './CommentWidget'
import { cardStyle } from './shared'
import { useGoalPopover } from '../GoalPopover'
import { BurndownWidget } from './BurndownWidget'
import { EnvelopeInfo } from './EnvelopeInfo'
import { StatisticWidget } from './StatisticWidget'

type EnvelopePreviewProps = {
  id: core.envelopes.TEnvelopeId
  onClose: () => void
}

export const EnvelopePreview: FC<EnvelopePreviewProps> = ({ onClose, id }) => {
  const { t } = useTranslation('budgets')
  const [month] = useMonth()
  const openGoalPopover = useGoalPopover()

  const envMetrics = useAppSelector(core.activity.selectEnvelopeMetrics)[month][
    id
  ]
  const env = useAppSelector(core.envelopes.selectAll)[id]

  const goalInfo = useAppSelector(core.goals.selectAll)[month][id]
  if (!envMetrics) return null

  const { currency } = envMetrics

  return (
    <div className="relative">
      <Header envelope={env} onClose={onClose} />
      <div className="grid gap-4 px-6 pb-10 pt-6">
        <CommentWidget key={id} id={id} />

        <ButtonBase
          onClick={e => openGoalPopover(id, e.currentTarget)}
          sx={{
            ...cardStyle,
            display: 'flex',
            justifyContent: 'flex-start',
            gap: 1,
          }}
        >
          <EmojiFlagsIcon />
          <Typography
            variant="body1"
            component="span"
            color={goalInfo ? 'text.primary' : 'text.disabled'}
            sx={{
              textAlign: 'left',
            }}
          >
            {goalInfo
              ? core.goals.formatGoal(goalInfo.goal, currency)
              : t('goal')}
          </Typography>
        </ButtonBase>

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
  const handleColorChange = useCallback(
    (hex?: string | null) => {
      track('envelope_color_changed', {})
      dispatch(core.envelopes.setColor(envelope.id, hex ?? null))
    },
    [dispatch, envelope.id]
  )
  const openColorPicker = useColorPicker(color, handleColorChange)
  return (
    <header className="sticky top-0 z-[5] flex items-center bg-card px-6 py-2">
      <div className="flex min-w-0 grow items-center">
        <TagIcon
          size="m"
          symbol={symbol}
          className="mr-4 shrink-0"
          color={color}
          onClick={openColorPicker}
          button
        />
        <h2 className="m-0 truncate type-title">{name}</h2>
      </div>
      <Tooltip title={t('edit')}>
        <IconButton
          onClick={() => openEditDialog({ envelope }, { key: envelope.id })}
          children={<EditIcon />}
        />
      </Tooltip>
      <Tooltip title={t('close')}>
        <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
      </Tooltip>
      <ColorPicker />
      <EnvelopeEditDialog />
    </header>
  )
}
