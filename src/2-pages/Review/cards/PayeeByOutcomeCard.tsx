import { ButtonBase, IconButton } from '@/6-shared/ui/Button'
import { useState } from 'react'
import { core } from '@/zerro-core/redux'

import { useTranslation } from 'react-i18next'

import type { TCardProps } from '../shared/Card'
import { Card } from '../shared/Card'
import { useStats } from '../shared/getFacts'
import { DisplayAmount } from '@/3-widgets/DisplayAmount'
import { entries } from '@/6-shared/helpers/keys'
import { ArrowBackIcon, ArrowForwardIcon } from '@/6-shared/ui/Icons'

export function PayeeByOutcomeCard(props: TCardProps) {
  const { t } = useTranslation('yearReview', { keyPrefix: 'payeeByOutcome' })
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
    .sort((a, b) => b.outcome - a.outcome)
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
        <ButtonBase
          className="rounded-lg px-2"
          onClick={() => props.onShowTransactions(transactions)}
        >
          <div className="flex flex-col items-center gap-2">
            <h2 className="red-gradient m-0 text-center type-display font-sans">
              {payee}
            </h2>
            <p className="m-0 text-center type-body font-sans">
              {t('spentHere ')}
              <DisplayAmount value={outcome} noShade decimals="ifOnly" />
              {t(' purchase', { count })}
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
