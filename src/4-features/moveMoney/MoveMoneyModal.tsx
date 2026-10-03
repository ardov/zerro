import type { FC } from 'react'
import { useState } from 'react'
import { core } from '@/zerro-core/redux'

import { CategorySymbol } from '@/6-shared/ui/CategoryIcon'
import { Chip } from '@/6-shared/ui/kit/Chip'
import { IconButton } from '@/6-shared/ui/kit/Button'
import { DialogSurface } from '@/6-shared/ui/kit/Dialog'
import { FieldAddon } from '@/6-shared/ui/kit/Field'
import { AmountInput } from '@/6-shared/ui/kit/AmountInput'
import { ArrowForwardIcon } from '@/6-shared/ui/Icons'
import { useTranslation } from 'react-i18next'
import type { TISOMonth } from '@/6-shared/types'
import { useAppDispatch, useAppSelector } from '@/store'

import { moveMoney } from './moveMoney'

export type MoveMoneyModalProps = {
  open: boolean
  month: TISOMonth
  source: core.envelopes.TEnvelopeId | 'toBeAssigned'
  destination: core.envelopes.TEnvelopeId | 'toBeAssigned'
  onClose: () => void
}

export const MoveMoneyModal: FC<MoveMoneyModalProps> = props => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { open, onClose, source, month, destination } = props

  const envelopes = useAppSelector(core.envelopes.selectAll)
  const metrics = useAppSelector(core.activity.selectEnvelopeMetrics)[month]
  const totalMetrics = useAppSelector(core.months.selectTotals)[month]
  const [currency] = core.currency.useDisplayCurrency()
  const toDisplay = core.currency.useToDisplay(month)

  const sourceEnvelope =
    source === 'toBeAssigned' ? undefined : envelopes[source]
  const destinationEnvelope =
    destination === 'toBeAssigned' ? undefined : envelopes[destination]

  const sourceName =
    sourceEnvelope?.name ?? t('toBeAssigned', { ns: 'budgets' })
  const destinationName =
    destinationEnvelope?.name ?? t('toBeAssigned', { ns: 'budgets' })

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

  const handleSubmit = (value = amount) => {
    if (value) {
      dispatch(moveMoney(value, currency, source, destination, month))
    }
    onClose()
  }

  return (
    <DialogSurface
      controller={{
        open,
        setOpen: next => {
          if (!next) onClose()
        },
      }}
      label={`${sourceName} → ${destinationName}`}
      mobile="drawer"
      className="max-w-88"
      closeButton={false}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <EnvelopeChip envelope={sourceEnvelope} name={sourceName} />
          <span className="mx-2 flex items-center">
            <ArrowForwardIcon />
          </span>
          <EnvelopeChip envelope={destinationEnvelope} name={destinationName} />
        </div>
        <AmountInput
          value={amount}
          onChange={setAmount}
          onEnter={handleSubmit}
          autoFocus
          selectOnFocus
          placeholder="0"
          label={t('amount', { ns: 'transaction' })}
          start={<FieldAddon>{currency}</FieldAddon>}
          end={
            <FieldAddon kind="action">
              <IconButton
                size="sm"
                tooltip={false}
                variant="ghost"
                label={t('apply')}
                onClick={() => handleSubmit()}
              >
                <ArrowForwardIcon />
              </IconButton>
            </FieldAddon>
          }
        />
      </div>
    </DialogSurface>
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

function EnvelopeChip({
  envelope,
  name,
}: {
  envelope?: core.envelopes.TPresentedEnvelope
  name: string
}) {
  return (
    <Chip
      color={envelope?.colorHex ?? undefined}
      start={envelope ? <CategorySymbol symbol={envelope.symbol} /> : undefined}
    >
      {name}
    </Chip>
  )
}
