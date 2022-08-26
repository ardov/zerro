import React, { FC, useState } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Grid,
  ButtonBase,
  Button,
} from '@mui/material'
import { EmojiIcon } from 'shared/ui/EmojiIcon'
import { Tooltip } from 'shared/ui/Tooltip'
import { CloseIcon, EditIcon, EmojiFlagsIcon } from 'shared/ui/Icons'
import { useAppDispatch } from 'store'
import { Total } from '../../../../shared/ui/Total'
import Rhythm from 'shared/ui/Rhythm'
import { useMonth } from 'pages/BudgetsOld/pathHooks'
import { ActivityWidget } from './ActivityWidget'
import { ColorPicker } from 'shared/ui/ColorPickerPopover'
import { sendEvent } from 'shared/helpers/tracking'
import { useToggle } from 'shared/hooks/useToggle'
import { useSearchParam } from 'shared/hooks/useSearchParam'
import { IEnvelopeWithData, useEnvelope, useRates } from 'models/envelopeData'
import { TEnvelopeId, TFxAmount } from 'shared/types'
import { convertFx } from 'shared/helpers/money'
import { CommentWidget } from './CommentWidget'
import { goalToWords } from 'models/goal'
import { cardStyle } from './shared'
import { patchEnvelope } from 'models/envelope'
import { EnvelopeEditDialog } from './EnvelopeEditDialog'
import { DataLine } from 'shared/ui/DataLine'

type EnvelopePreviewProps = {
  id: TEnvelopeId
  onClose: () => void
}

export const EnvelopePreview: FC<EnvelopePreviewProps> = ({ onClose, id }) => {
  const [month] = useMonth()
  const [, setId] = useSearchParam('transactions')
  const rates = useRates(month)

  const envelope = useEnvelope(month, id)
  const { goal, currency } = envelope

  const toEnvelope = (a: TFxAmount) => convertFx(a, currency, rates)

  const totalLeftover = toEnvelope(envelope.totalLeftover)
  const totalBudgeted = toEnvelope(envelope.totalBudgeted)
  const totalActivity = toEnvelope(envelope.totalActivity)
  const totalAvailable = toEnvelope(envelope.totalAvailable)

  return (
    <>
      <Box position="relative">
        <Header envelope={envelope} onClose={onClose} />

        <Grid container spacing={2} px={3} pt={3}>
          <Grid item xs={12}>
            <CommentWidget key={id} month={month} id={id} />
          </Grid>

          <Grid item xs={12}>
            <ButtonBase
              // TODO show popover on click
              // onClick={e => setGoalPopoverAnchor(e.currentTarget)}
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
                color={goal ? 'text.primary' : 'text.hint'}
              >
                {goal ? goalToWords(goal) : 'Цель'}
              </Typography>
            </ButtonBase>
          </Grid>

          <Grid item xs={6}>
            <ButtonBase
              // onClick={e => setBudgetPopoverAnchor(e.currentTarget)}
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
            <Button onClick={() => setId(id)} fullWidth>
              Показать операции
            </Button>
          </Box>
        </Rhythm>
      </Box>

      {/* <BudgetPopover
        id={id}
        month={month}
        open={!!budgetPopoverAnchor}
        anchorEl={budgetPopoverAnchor}
        onClose={() => setBudgetPopoverAnchor(undefined)}
      /> */}
      {/* <GoalPopover
        id={id}
        month={month}
        open={!!goalPopoverAnchor}
        anchorEl={goalPopoverAnchor}
        onClose={() => setGoalPopoverAnchor(undefined)}
      /> */}
    </>
  )
}

const Header: FC<{
  envelope: IEnvelopeWithData
  onClose: () => void
}> = ({ envelope, onClose }) => {
  const { symbol, color, name } = envelope
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)
  const [showEditor, toggleEditor] = useToggle()
  const dispatch = useAppDispatch()
  const handleColorChange = (hex?: string | null) => {
    sendEvent('Tag: set color: ' + hex)
    // TODO set color on envelopes
    dispatch(patchEnvelope({ id: envelope.id, color: hex }))
  }
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
          onClick={e => setAnchorEl(e.currentTarget)}
          button
        />
        <Typography variant="h6" component="span" noWrap>
          {name}
        </Typography>
      </Box>

      <Tooltip title="Изменить">
        <IconButton onClick={toggleEditor} children={<EditIcon />} />
      </Tooltip>
      <Tooltip title="Закрыть">
        <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
      </Tooltip>

      <ColorPicker
        open={!!anchorEl}
        anchorEl={anchorEl}
        value={color}
        onClose={() => setAnchorEl(null)}
        onChange={handleColorChange}
      />

      {/* TODO add edit dialog for envelopes */}

      <EnvelopeEditDialog
        key={envelope.id}
        open={showEditor}
        onClose={toggleEditor}
        envelope={envelope}
      />
    </Box>
  )
}
