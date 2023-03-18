import React, { FC, useCallback } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Grid,
  ButtonBase,
  Button,
} from '@mui/material'
import { EmojiIcon } from '@shared/ui/EmojiIcon'
import { Tooltip } from '@shared/ui/Tooltip'
import { CloseIcon, EditIcon, EmojiFlagsIcon } from '@shared/ui/Icons'
import { Total } from '@shared/ui/Total'
import Rhythm from '@shared/ui/Rhythm'
import { ColorPicker, useColorPicker } from '@shared/ui/ColorPickerPopover'
import { sendEvent } from '@shared/helpers/tracking'
import { TFxAmount } from '@shared/types'
import { convertFx } from '@shared/helpers/money'
// import { usePopover } from '@shared/ui/PopoverManager'
import { DataLine } from '@components/DataLine'

import { useAppDispatch } from '@store'
import { envelopeModel, TEnvelope, TEnvelopeId } from '@entities/envelope'
import { balances, TrFilterMode } from '@entities/envBalances'
import { goalModel } from '@entities/goal'
import { useMonth } from '../MonthProvider'
import { useBudgetPopover } from '../BudgetPopover'
import { EnvelopeEditDialog, useEditDialog } from '../EnvelopeEditDialog'
import { ActivityWidget } from './ActivityWidget'
import { CommentWidget } from './CommentWidget'
import { cardStyle } from './shared'
import { useGoalPopover } from '../GoalPopover'
import { useTrDrawer } from '../TransactionsDrawer'

type EnvelopePreviewProps = {
  id: TEnvelopeId
  onClose: () => void
}

export const EnvelopePreview: FC<EnvelopePreviewProps> = ({ onClose, id }) => {
  const [month] = useMonth()
  const showTransactions = useTrDrawer()
  const openBudgetPopover = useBudgetPopover()
  const openGoalPopover = useGoalPopover()
  const rates = balances.useRates()[month].rates
  const envMetrics = balances.useEnvData()[month][id]
  const env = envelopeModel.useEnvelopes()[id]

  const goalInfo = goalModel.useGoals()[month][id]
  if (!envMetrics) return null

  const { currency } = envMetrics
  const toEnvelope = (a: TFxAmount) => convertFx(a, currency, rates)
  const totalLeftover = toEnvelope(envMetrics.totalLeftover)
  const totalBudgeted = toEnvelope(envMetrics.totalBudgeted)
  const totalActivity = toEnvelope(envMetrics.totalActivity)
  const totalAvailable = toEnvelope(envMetrics.totalAvailable)

  return (
    <>
      <Box position="relative">
        <Header envelope={env} onClose={onClose} />

        <Grid container spacing={2} px={3} pt={3}>
          <Grid item xs={12}>
            <CommentWidget key={id} month={month} id={id} />
          </Grid>

          <Grid item xs={12}>
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
                color={goalInfo ? 'text.primary' : 'text.hint'}
              >
                {goalInfo ? goalModel.toWords(goalInfo.goal, currency) : 'Цель'}
              </Typography>
            </ButtonBase>
          </Grid>

          <Grid item xs={6}>
            <ButtonBase
              onClick={e => openBudgetPopover(id, e.currentTarget)}
              sx={cardStyle}
            >
              <Total name="Бюджет" value={totalBudgeted} decMode="ifAny" />
            </ButtonBase>
          </Grid>

          <Grid item xs={6}>
            <Box sx={cardStyle}>
              <Total name="Доступно" value={totalAvailable} decMode="ifAny" />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <ActivityWidget id={id} />
          </Grid>
        </Grid>

        <Rhythm gap={1.5} px={3} mt={3}>
          <DataLine
            name="Остаток с прошлого месяца"
            amount={totalLeftover}
            currency={currency}
          />
          <DataLine name="Бюджет" amount={totalBudgeted} currency={currency} />
          <DataLine name="Расход" amount={totalActivity} currency={currency} />
          <Box>
            <Button
              onClick={() =>
                showTransactions({ id, month, mode: TrFilterMode.Envelope })
              }
              fullWidth
            >
              Показать операции
            </Button>
          </Box>
        </Rhythm>
      </Box>
    </>
  )
}

const Header: FC<{
  envelope: TEnvelope
  onClose: () => void
}> = ({ envelope, onClose }) => {
  const { symbol, color, name } = envelope
  const openEditDialog = useEditDialog()
  const dispatch = useAppDispatch()
  const handleColorChange = useCallback(
    (hex?: string | null) => {
      sendEvent('Tag: set color: ' + hex)
      dispatch(envelopeModel.patchEnvelope({ id: envelope.id, color: hex }))
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

      <Tooltip title="Изменить">
        <IconButton
          onClick={() => openEditDialog({ envelope }, { key: envelope.id })}
          children={<EditIcon />}
        />
      </Tooltip>
      <Tooltip title="Закрыть">
        <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
      </Tooltip>

      <ColorPicker />
      <EnvelopeEditDialog />
    </Box>
  )
}
