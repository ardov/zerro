import { IconButton } from '@/6-shared/ui/Button'
import { useState } from 'react'
import { formatDate } from '@/6-shared/helpers/date'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'

import { DisplayAmount } from '@/3-widgets/DisplayAmount'
import type { TCardProps } from '../shared/Card'
import { Card } from '../shared/Card'
import { useStats } from '../shared/getFacts'
import { useTrToDisplay } from '../shared/useTrToDisplay'
import { ArrowBackIcon, ArrowForwardIcon } from '@/6-shared/ui/Icons'
import { useTranslation } from 'react-i18next'

export function OutcomeCard(props: TCardProps) {
  const { t } = useTranslation('yearReview', { keyPrefix: 'outcomeCard' })
  const [i, setI] = useState(0)
  const yearStats = useStats(props.year)
  const toVal = useTrToDisplay()
  const tags = useAppSelector(core.tags.selectPopulated)

  const topTransactions = yearStats.total.outcomeTransactions
    .map(tr => ({ tr, val: toVal(tr).outcome }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 10)

  if (!topTransactions.length) return null

  const next = () => setI(Math.min(i + 1, topTransactions.length - 1))
  const prev = () => setI(Math.max(i - 1, 0))

  const { val, tr } = topTransactions[i]
  const { date, comment, payee, tag } = tr

  const tagTitle = tags[tag?.[0] || 'null'].title
  const additionalInfo = [formatDate(date)]
  if (tagTitle) additionalInfo.push(tagTitle)
  if (payee) additionalInfo.push(payee)
  return (
    <Card>
      <div className="my-2 flex flex-col items-center gap-2">
        <p className="m-0 text-center type-body">
          {t('purchaseOfTheYear', { number: i + 1 })}
        </p>
        <h2 className="red-gradient m-0 text-center type-display">
          <DisplayAmount value={val} noShade decimals="ifAny" />
        </h2>
        <p className="m-0 text-center type-body text-muted-foreground">
          {additionalInfo.join('  •  ')}
        </p>
        {comment && (
          <div className="self-center rounded-lg bg-background px-4 py-1">
            <p className="m-0 text-center type-body text-muted-foreground">
              {comment}
            </p>
          </div>
        )}

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
