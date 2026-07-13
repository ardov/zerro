import React from 'react'
import { currency as coreCurrency } from 'zerro-core/redux'

import { Dialog, IconButton, Link, Stack, Typography } from '@mui/material'
import Balancer from 'react-wrap-balancer'
import pluralize from '6-shared/helpers/pluralize'
import { TFxAmount } from '6-shared/types'
import { HelpOutlineIcon } from '6-shared/ui/Icons'
import { useToggle } from '6-shared/hooks/useToggle'
import { Amount } from '6-shared/ui/Amount'

/** Median salary in Russia 2024. Source: https://sberindex.ru/ru/dashboards/median-wages */
const MEDIAN_WAGE_RUB = 62_632
const MEDIAN_WAGE_SOURCE = 'https://sberindex.ru/ru/dashboards/median-wages'

export function NotFunFact({ income }: { income: TFxAmount }) {
  const [isOpenInfo, toggleInfo] = useToggle(false)
  const toDisplay = coreCurrency.useToDisplay('current')
  const rubIncome = income.RUB || 0
  const monthlyIncome = toDisplay(income) / 12
  const displayMedianWage = toDisplay({ RUB: MEDIAN_WAGE_RUB })
  const rate = Math.round(monthlyIncome / displayMedianWage)

  // Shown when income in rubbles is greater than median wage and total monthly incom is greater than median wage
  if (rubIncome < MEDIAN_WAGE_RUB || rate < 1) return null

  return (
    <>
      <Stack direction="column" spacing={1} sx={{ p: 3 }}>
        <Typography variant="h5" align="center">
          <Balancer>{getPeopleArray(rate).join(' ')}</Balancer>
        </Typography>
        <Typography variant="body1" align="center">
          {`Это ${rate} ${pluralize(rate, [
            'средний россиянин',
            'средних россиянина',
            'средних россиян',
          ])}.`}
          <br />
          Если сложить их зарплаты — получится ваша.{' '}
          <IconButton size="small" onClick={toggleInfo}>
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Typography>
      </Stack>

      <Dialog open={isOpenInfo} onClose={toggleInfo}>
        <Stack direction="column" spacing={3} sx={{ p: 3, maxWidth: 360 }}>
          <Balancer>
            <Typography variant="body1">
              Медианная зарплата в 2024 году в России{' '}
              <Amount value={MEDIAN_WAGE_RUB} currency="RUB" decimals="ifAny" />{' '}
              по данным <Link href={MEDIAN_WAGE_SOURCE}>Сбериндекса</Link>. Это
              значит, что половина россиян получают меньше этой суммы.
            </Typography>
          </Balancer>
        </Stack>
      </Dialog>
    </>
  )
}

function getPeopleArray(length: number) {
  const people = [
    '👩🏼',
    '👨🏼‍🦳',
    '👨🏻',
    '👨🏼‍🦲',
    '👦🏽',
    '👩🏻',
    '👵🏻',
    '👴🏼',
    '👨🏻',
    '👨🏼‍🦲',
    '👵🏻',
    '👵',
    '👨🏼‍🦳',
    '👩‍🦳',
  ]
  let arr = []
  for (let i = 0; i < length; i++) {
    arr.push(people[i % (people.length - 1)])
  }
  return arr
}
