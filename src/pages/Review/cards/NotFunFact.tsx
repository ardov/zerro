import React from 'react'
import { Typography } from '@mui/material'
import pluralize from '@shared/helpers/pluralize'
import { Amount } from '@shared/ui/Amount'
import { round } from '@shared/helpers/money'
import { TFxAmount } from '@shared/types'

export function NotFunFact({ income }: { income: TFxAmount }) {
  /** Average salary in Russia. Source: https://rosstat.gov.ru/labor_market_employment_salaries# */
  const AVG_MONTHLY_INCOME = 40000
  const rubIncome = income.RUB
  if (!rubIncome || rubIncome < 30000) return null
  const monthlyIncome = rubIncome / 12
  const rate = +(monthlyIncome / AVG_MONTHLY_INCOME).toFixed(0)
  const vat = rubIncome * (13 / 87)
  return (
    <Typography variant="body1" align="center">
      Платили 13% подоходного налога c{' '}
      <Amount value={rubIncome} currency={'RUB'} noShade decMode="ifOnly" />?
      <br />
      Значит ещё{' '}
      <Amount value={vat} currency={'RUB'} noShade decMode="ifOnly" /> ушло в
      казну 🇷🇺
      {rate > 1 && (
        <>
          <br />
          <br />
          {getPeopleArray(rate).join(' ')}
          <br />
          {`Это ${rate} ${pluralize(rate, [
            'средний россиянин',
            'средних россиянина',
            'средних россиян',
          ])}.`}
          <br />
          Если сложить их зарплаты — получится ваша.
        </>
      )}
    </Typography>
  )
}

function getPeopleArray(length: number) {
  const people = ['👩🏼', '👨🏼‍🦳', '👨🏻', '👨🏼‍🦲', '👦🏽', '👩🏻', '👵🏻', '👴🏼']
  let arr = []
  for (let i = 0; i < length; i++) {
    arr.push(people[i % (people.length - 1)])
  }
  return arr
}

/** Source https://journal.tinkoff.ru/fns-loves-you/ */
const ruIncomeTaxes = [
  { name: 'Пенсионные взносы', rate: 0.22, comment: '' },
  { name: 'НДФЛ', rate: 0.13, comment: '' },
  { name: 'Медицинское страхование', rate: 0.051, comment: '' },
  { name: 'Социальное страхование', rate: 0.029, comment: '' },
  { name: 'Взнос в случае травм на работе', rate: 0.002, comment: '' },
]

/** Source https://journal.tinkoff.ru/fns-loves-you/ */
const ruOutcomeTaxes = [
  { name: 'НДС', rate: 0.125, comment: '' },
  { name: 'Налоги компаний', rate: 0.024, comment: '' },
]

function getTaxesByIncome(income: number) {
  const rawSalary = income / 0.87
  const categories = ruIncomeTaxes.map(t => ({
    value: round(rawSalary * t.rate),
    ...t,
  }))
  let total = categories.reduce((sum, t) => round(sum + t.value), 0)

  return { total, categories }
}

function getTaxesByOutcome(outcome: number) {
  const categories = ruOutcomeTaxes.map(t => ({
    value: round(outcome * t.rate),
    ...t,
  }))
  let total = categories.reduce((sum, t) => round(sum + t.value), 0)

  return { total, categories }
}
