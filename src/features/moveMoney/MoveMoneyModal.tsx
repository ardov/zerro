import React, { FC, useState } from 'react'
import Dialog, { DialogProps } from '@mui/material/Dialog'
import { AmountInput } from '@shared/ui/AmountInput'
import { ArrowForwardIcon, ArrowRightAltIcon } from '@shared/ui/Icons'
import { Box, InputAdornment, IconButton, Chip } from '@mui/material'
import { moveMoney } from './moveMoney'
import { useAppDispatch, useAppSelector } from '@store'
import { Modify, TISOMonth, TEnvelopeId } from '@shared/types'
import { getMonthTotals } from '@entities/envelopeData'
import { convertFx } from '@shared/helpers/money'

export type MoveMoneyModalProps = Modify<
  DialogProps,
  {
    month: TISOMonth
    source: TEnvelopeId | 'toBeBudgeted'
    destination: TEnvelopeId | 'toBeBudgeted'
    onClose: () => void
  }
>

export const MoveMoneyModal: FC<MoveMoneyModalProps> = props => {
  const dispatch = useAppDispatch()
  const { open, onClose, source, month, destination } = props

  const totals = useAppSelector(getMonthTotals)[month]

  const sourceName =
    source === 'toBeBudgeted'
      ? 'To be budgeted'
      : totals.envelopes[source].env.name
  const destinationName =
    destination === 'toBeBudgeted'
      ? 'To be budgeted'
      : totals.envelopes[destination].env.name

  const sourceValue =
    source === 'toBeBudgeted'
      ? totals.toBeBudgeted
      : convertFx(
          totals.envelopes[source].selfAvailable,
          totals.currency,
          totals.rates
        )
  const destinationValue =
    destination === 'toBeBudgeted'
      ? totals.toBeBudgeted
      : convertFx(
          totals.envelopes[destination].selfAvailable,
          totals.currency,
          totals.rates
        )

  const suggestedAmount = suggestAmount(sourceValue, destinationValue, 1000)

  const [amount, setAmount] = useState(suggestedAmount)
  const handleSubmit = () => {
    if (amount) {
      dispatch(moveMoney(amount, totals.currency, source, destination, month))
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <Box display="flex" flexDirection="column" p={2}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={1}
          mb={2}
        >
          <Chip label={sourceName} />
          <Box mx={1} display="flex" alignItems="center">
            <ArrowRightAltIcon />
          </Box>
          <Chip label={destinationName} />
        </Box>
        <AmountInput
          value={amount}
          onChange={setAmount}
          onEnter={handleSubmit}
          autoFocus
          selectOnFocus
          fullWidth
          placeholder="0"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end" onClick={handleSubmit}>
                  <ArrowForwardIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Dialog>
  )
}

function suggestAmount(from = 0, to = 0, defaultAmount = 1000) {
  // No money to move --> 0
  if (from <= 0) return 0
  // Enough money to cover overspend --> overspend
  if (to < 0 && from >= -to) return -to
  // Not enough money to cover overspend --> move all we have
  if (to < 0 && from < -to) return from
  // Less money than default value --> move all we have
  if (to >= 0 && from < defaultAmount) return from
  // Else move default value
  return defaultAmount
}
