import { ButtonBase, IconButton } from '@/6-shared/ui/Button'
import { useState } from 'react'
import { core } from '@/zerro-core/redux'

import { useTranslation } from 'react-i18next'

import type { TCardProps } from '../shared/Card'
import { Card } from '../shared/Card'
import { useStats } from '../shared/getFacts'
import { entries } from '@/6-shared/helpers/keys'
import { DisplayAmount } from '@/3-widgets/DisplayAmount'
import { ArrowForwardIcon, ArrowBackIcon } from '@/6-shared/ui/Icons'

export function PayeeByFrequencyCard(props: TCardProps) {
  const { t } = useTranslation('yearReview', { keyPrefix: 'payeeByFrequency' })
  const [i, setI] = useState(0)
  const yearStats = useStats(props.year)
  const toDisplay = core.currency.useToDisplay('current')

  const topPayees = entries(yearStats.byPayee)
    .map(([payee, info]) => {
      return {
        payee,
        transactions: info.outcomeTransactions,
        outcome: toDisplay(info.outcome),
      }
    })
    .sort((a, b) => b.transactions.length - a.transactions.length)
    .filter(p => p.payee && p.payee !== 'null')
    .slice(0, 10)

  if (topPayees.length === 0) return null

  const next = () => setI(Math.min(i + 1, topPayees.length - 1))
  const prev = () => setI(Math.max(i - 1, 0))
  const { payee, transactions, outcome } = topPayees[i]
  const count = transactions.length

  if (!outcome) return null

  return (
    <Card>
      <div className="flex flex-col items-center gap-2">
        <p className="m-0 text-center type-body">
          {t('favouritePlace', { number: i + 1 })}
        </p>

        <ButtonBase
          className="rounded-lg px-2"
          onClick={() => props.onShowTransactions(transactions)}
        >
          <div className="flex flex-col items-center gap-2">
            <h2 className="info-gradient m-0 text-center type-display font-sans">
              {payee}
            </h2>

            <p className="m-0 text-center type-body font-sans">
              {t('purchase', { count })}
              <DisplayAmount
                value={outcome / count}
                noShade
                decimals="ifOnly"
              />
              <br />
              {t('andTotalSpend')}
              <DisplayAmount value={outcome} noShade decimals="ifAny" />
            </p>
          </div>
        </ButtonBase>

        <div className="flex flex-row items-center gap-2 opacity-30 transition-opacity duration-200 hover:opacity-100">
          <IconButton size="small" onClick={prev}>
            <ArrowBackIcon />
          </IconButton>

          <IconButton size="small" onClick={next}>
            <ArrowForwardIcon />
          </IconButton>
        </div>
      </div>
    </Card>
  )
}
