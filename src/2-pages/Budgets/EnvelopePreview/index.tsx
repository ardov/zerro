import type { FC } from 'react'
import { useCallback } from 'react'
import { Box, Typography, IconButton, Grid, ButtonBase } from '@mui/material'
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
    <Box
      sx={{
        position: 'relative',
      }}
    >
      <Header envelope={env} onClose={onClose} />
      <Grid
        container
        spacing={2}
        sx={{
          px: 3,
          pb: 5,
          pt: 3,
        }}
      >
        <Grid size={12}>
          <CommentWidget key={id} id={id} />
        </Grid>

        <Grid size={12}>
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
        </Grid>

        <Grid size={12}>
          <EnvelopeInfo month={month} id={id} />
        </Grid>

        <Grid size={12}>
          <BurndownWidget id={id} />
        </Grid>

        <Grid size={12}>
          <ActivityWidget id={id} />
        </Grid>

        <Grid size={12}>
          <StatisticWidget id={id} />
        </Grid>
      </Grid>
    </Box>
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
    <Box
      sx={{
        py: 1,
        px: 3,
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        bgcolor: 'background.paper',
        zIndex: 5,
        top: 0,
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          minWidth: 0,
          alignItems: 'center',
        }}
      >
        <TagIcon
          size="m"
          symbol={symbol}
          sx={{ mr: 2, flexShrink: 0 }}
          color={color}
          onClick={openColorPicker}
          button
        />
        <Typography variant="h6" component="span" noWrap>
          {name}
        </Typography>
      </Box>
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
    </Box>
  )
}
