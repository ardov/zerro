import { FC, useState } from 'react'
import { core } from 'zerro-core/redux'

import { Box, InputAdornment, IconButton, Chip } from '@mui/material'
import Dialog, { DialogProps } from '@mui/material/Dialog'
import { AmountInput } from '6-shared/ui/AmountInput'
import { ArrowForwardIcon } from '6-shared/ui/Icons'
import { Modify, TISOMonth } from '6-shared/types'
import { useAppDispatch, useAppSelector } from 'store'

import { moveMoney } from './moveMoney'

export type MoveMoneyModalProps = Modify<
  DialogProps,
  {
    month: TISOMonth
    source: core.envelopes.TEnvelopeId | 'toBeBudgeted'
    destination: core.envelopes.TEnvelopeId | 'toBeBudgeted'
    onClose: () => void
  }
>

export const MoveMoneyModal: FC<MoveMoneyModalProps> = props => {
  const dispatch = useAppDispatch()
  const { open, onClose, source, month, destination } = props

  const envelopes = useAppSelector(core.envelopes.selectAll)
  const metrics = useAppSelector(core.activity.selectEnvelopeMetrics)[month]
  const totalMetrics = useAppSelector(core.months.selectTotals)[month]
  const [currency] = core.currency.useDisplayCurrency()
  const toDisplay = core.currency.useToDisplay(month)

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

  const suggested = suggestAmount(sourceValue, destinationValue)
  const [amount, setAmount] = useState(suggested)

  const handleSubmit = () => {
    if (amount) {
      dispatch(moveMoney(amount, currency, source, destination, month))
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <Box sx={{ display: 'flex', flexDirection: 'column', p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mb: 2,
          }}
        >
          <Chip label={sourceName} />
          <Box sx={{ mx: 1, display: 'flex', alignItems: 'center' }}>
            <ArrowForwardIcon />
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
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" onClick={handleSubmit}>
                    <ArrowForwardIcon />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
    </Dialog>
  )
}

function suggestAmount(from = 0, to = 0) {
  // No money to move --> 0
  if (from <= 0) return 0
  // Enough money to cover overspend --> overspend
  if (to < 0 && from >= -to) return -to
  // Otherwise --> move all we have
  return from
}
