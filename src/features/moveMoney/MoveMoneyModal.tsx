import React, { FC, useState } from 'react'
import { Box, InputAdornment, IconButton, Chip } from '@mui/material'
import Dialog, { DialogProps } from '@mui/material/Dialog'
import { AmountInput } from '@shared/ui/AmountInput'
import { ArrowForwardIcon, ArrowRightAltIcon } from '@shared/ui/Icons'
import { Modify, TISOMonth, TEnvelopeId } from '@shared/types'
import { useAppDispatch } from '@store'

import { displayCurrency } from '@entities/currency/displayCurrency'
import { balances } from '@entities/envBalances'
import { moveMoney } from './moveMoney'
import { envelopeModel } from '@entities/envelope'

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

  const envelopes = envelopeModel.useEnvelopes()
  const metrics = balances.useEnvData()[month]
  const totalMetrics = balances.useTotals()[month]
  // const totals = useAppSelector(getMonthTotals)[month]
  const [currency] = displayCurrency.useDisplayCurrency()
  const toDisplay = displayCurrency.useToDisplay(month)

  const sourceName =
    source === 'toBeBudgeted' ? 'To be budgeted' : envelopes[source].name
  const destinationName =
    destination === 'toBeBudgeted'
      ? 'To be budgeted'
      : envelopes[destination].name

  const sourceValue =
    source === 'toBeBudgeted'
      ? toDisplay(totalMetrics.toBeBudgeted)
      : toDisplay(metrics[source].selfAvailable)
  const destinationValue =
    destination === 'toBeBudgeted'
      ? toDisplay(totalMetrics.toBeBudgeted)
      : toDisplay(metrics[destination].selfAvailable)

  const suggestedAmount = suggestAmount(sourceValue, destinationValue, 1000)

  const [amount, setAmount] = useState(suggestedAmount)
  const handleSubmit = () => {
    if (amount) {
      dispatch(moveMoney(amount, currency, source, destination, month))
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
