import React, { FC, useCallback } from 'react'
import { Box, Typography, IconButton, Grid, ButtonBase } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { EmojiIcon } from '6-shared/ui/EmojiIcon'
import { Tooltip } from '6-shared/ui/Tooltip'
import { CloseIcon, EditIcon, EmojiFlagsIcon } from '6-shared/ui/Icons'
import { ColorPicker, useColorPicker } from '6-shared/ui/ColorPickerPopover'
import { sendEvent } from '6-shared/helpers/tracking'
// import { usePopover } from '@shared/ui/PopoverManager'

import { useAppDispatch } from 'store'
import { envelopeModel, TEnvelope, TEnvelopeId } from '5-entities/envelope'
import { balances } from '5-entities/envBalances'
import { goalModel } from '5-entities/goal'
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
  id: TEnvelopeId
  onClose: () => void
}

export const EnvelopePreview: FC<EnvelopePreviewProps> = ({ onClose, id }) => {
  const { t } = useTranslation('budgets')
  const [month] = useMonth()
  const openGoalPopover = useGoalPopover()

  const envMetrics = balances.useEnvData()[month][id]
  const env = envelopeModel.useEnvelopes()[id]

  const goalInfo = goalModel.useGoals()[month][id]
  if (!envMetrics) return null

  const { currency } = envMetrics

  return (
    <Box position="relative">
      <Header envelope={env} onClose={onClose} />

      <Grid container spacing={2} px={3} pb={5} pt={3}>
        <Grid size={12}>
          <CommentWidget key={id} month={month} id={id} />
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
              textAlign="left"
              component="span"
              color={goalInfo ? 'text.primary' : 'text.disabled'}
            >
              {goalInfo
                ? goalModel.toWords(goalInfo.goal, currency)
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
  envelope: TEnvelope
  onClose: () => void
}> = ({ envelope, onClose }) => {
  const { symbol, colorHex: color, name } = envelope
  const { t } = useTranslation('common')
  const openEditDialog = useEditDialog()
  const dispatch = useAppDispatch()
  const handleColorChange = useCallback(
    (hex?: string | null) => {
      sendEvent('Tag: set color: ' + hex)
      dispatch(envelopeModel.patchEnvelope({ id: envelope.id, colorHex: hex }))
    },
    [dispatch, envelope.id]
  )
  const openColorPicker = useColorPicker(color, handleColorChange)
  return (
    <Box
      py={1}
      px={3}
      display="flex"
      alignItems="center"
      position="sticky"
      bgcolor="background.paper"
      zIndex={5}
      top={0}
    >
      <Box flexGrow={1} display="flex" minWidth={0} alignItems="center">
        <EmojiIcon
          size="m"
          symbol={symbol}
          mr={2}
          flexShrink={0}
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
