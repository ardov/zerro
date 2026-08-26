import { useState } from 'react'
import { core } from 'zerro-core/redux'

import { Chip } from '@mui/material'
import { entries } from '6-shared/helpers/keys'
import { addFxAmount } from '6-shared/helpers/money'
import { useAppSelector } from 'store'

import { DisplayAmount } from '3-widgets/DisplayAmount'

import type { TCardProps } from '../../shared/Card'
import { Card } from '../../shared/Card'
import { useStats } from '../../shared/getFacts'
import { NotFunFact } from './NotFunFact'
import { useTranslation } from 'react-i18next'

export function IncomeCard(props: TCardProps) {
  const { t } = useTranslation('yearReview', { keyPrefix: 'incomeCard' })
  const yearStats = useStats(props.year)
  const toDisplay = core.currency.useToDisplay('current')
  const tags = useAppSelector(core.tags.selectPopulated)

  const incomeTags = entries(yearStats.byTag)
    .map(([id, info]) => {
      return {
        id: id,
        tag: tags[id],
        name: tags[id].uniqueName,
        incomeFx: info.income,
        income: toDisplay(info.income),
        transactions: info.incomeTransactions,
      }
    })
    .filter(tagInfo => tagInfo.income > 0)
    .sort((a, b) => b.income - a.income)

  const [checked, setChecked] = useState(incomeTags.map(t => t.id))

  const totalIncomeFx = incomeTags
    .filter(t => checked.includes(t.id))
    .reduce((sum, t) => addFxAmount(sum, t.incomeFx), {})

  const monthlyIncome = toDisplay(totalIncomeFx) / 12

  const toggle = (id: string) => {
    if (checked.includes(id)) {
      setChecked(checked.filter(tagId => tagId !== id))
    } else {
      setChecked([...checked, id])
    }
  }

  return (
    <Card>
      <div className="flex flex-col items-center gap-2">
        <p className="m-0 text-center type-body">{t('youEarned')}</p>
        <h2 className="green-gradient m-0 text-center type-display">
          <DisplayAmount value={totalIncomeFx} noShade decimals="ifOnly" />
        </h2>
        <p className="m-0 text-center type-body-sm text-muted-foreground">
          <DisplayAmount value={monthlyIncome} noShade decimals="ifOnly" />{' '}
          {t('perMonth')}
        </p>
        <NotFunFact income={totalIncomeFx} />
      </div>
      <div className="mt-6 text-center">
        {incomeTags.map(tagInfo => (
          <span key={tagInfo.id} className="m-1 inline-block">
            <Chip
              variant={checked.includes(tagInfo.id) ? 'filled' : 'outlined'}
              clickable
              onClick={() => toggle(tagInfo.id)}
              onDoubleClick={() =>
                props.onShowTransactions(tagInfo.transactions)
              }
              label={
                <>
                  {tagInfo.name} (
                  <DisplayAmount
                    value={tagInfo.incomeFx}
                    noShade
                    decimals="ifOnly"
                  />
                  )
                </>
              }
            />
          </span>
        ))}
      </div>
    </Card>
  )
}
