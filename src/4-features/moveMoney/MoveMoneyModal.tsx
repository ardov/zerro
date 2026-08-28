import type { FC } from 'react'
import { useState } from 'react'
import { core } from 'zerro-core/redux'

import { Chip } from '@mui/material'
import { IconButton } from '6-shared/ui/Button'
import type { DialogProps } from '@mui/material/Dialog'
import Dialog from '@mui/material/Dialog'
import { AmountInput } from '6-shared/ui/AmountInput'
import { ArrowForwardIcon } from '6-shared/ui/feather'
import { useTranslation } from 'react-i18next'
import type { Modify, TISOMonth } from '6-shared/types'
import { useAppDispatch, useAppSelector } from 'store'

import { moveMoney } from './moveMoney'

export type MoveMoneyModalProps = Modify<
  DialogProps,
  {
    month: TISOMonth
    source: core.envelopes.TEnvelopeId | 'toBeAssigned'
    destination: core.envelopes.TEnvelopeId | 'toBeAssigned'
    onClose: () => void
  }
>

export const MoveMoneyModal: FC<MoveMoneyModalProps> = props => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { open, onClose, source, month, destination } = props

  const envelopes = useAppSelector(core.envelopes.selectAll)
  const metrics = useAppSelector(core.activity.selectEnvelopeMetrics)[month]
  const totalMetrics = useAppSelector(core.months.selectTotals)[month]
  const [currency] = core.currency.useDisplayCurrency()
  const toDisplay = core.currency.useToDisplay(month)

  const sourceName =
    source === 'toBeAssigned' ? 'To be assigned' : envelopes[source].name
  const destinationName =
    destination === 'toBeAssigned'
      ? 'To be assigned'
      : envelopes[destination].name

  const sourceValue =
    source === 'toBeAssigned'
      ? toDisplay(totalMetrics.toBeAssigned)
      : toDisplay(metrics[source].selfAvailable)
  const destinationValue =
    destination === 'toBeAssigned'
      ? toDisplay(totalMetrics.toBeAssigned)
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
      <div className="flex flex-col p-4">
        <div className="mb-4 flex items-center justify-center gap-2">
          <Chip label={sourceName} />
          <span className="mx-2 flex items-center">
            <ArrowForwardIcon />
          </span>
          <Chip label={destinationName} />
        </div>
        <AmountInput
          value={amount}
          onChange={setAmount}
          onEnter={handleSubmit}
          autoFocus
          selectOnFocus
          fullWidth
          placeholder="0"
          endAdornment={
            <IconButton
              edge="end"
              aria-label={t('apply')}
              onClick={handleSubmit}
            >
              <ArrowForwardIcon />
            </IconButton>
          }
        />
      </div>
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
