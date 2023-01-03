import React, { useMemo, useState } from 'react'
import {
  Box,
  Checkbox,
  Chip,
  Dialog,
  Divider,
  FormControlLabel,
  FormGroup,
  IconButton,
  Link,
  Stack,
  Typography,
} from '@mui/material'
import Balancer from 'react-wrap-balancer'
import pluralize from '@shared/helpers/pluralize'
import { Amount } from '@shared/ui/Amount'
import { round } from '@shared/helpers/money'
import { TFxAmount } from '@shared/types'
import { Card, TCardProps } from '../../shared/Card'
import { useStats } from '../../shared/getFacts'
import {
  DisplayAmount,
  displayCurrency,
} from '@entities/currency/displayCurrency'
import { useAppSelector } from '@store/index'
import { getPopulatedTags } from '@entities/tag'
import { entries } from '@shared/helpers/keys'
import { useToggle } from '@shared/hooks/useToggle'
import { TagSelect } from './TagSelect'
import { TaxesChart } from './Chart'
import { getTaxes } from './getTaxesByIncome'
import { SettingsIcon } from '@shared/ui/Icons'
import { Tooltip } from '@shared/ui/Tooltip'

export function NotFunCard(props: TCardProps) {
  const [settings, toggleSettings] = useToggle(false)
  const [onlyRUB, toggleRUB] = useToggle(false)
  const { income, outcome } = useIncomeOutcome(onlyRUB, props.year)
  const [checkedIncome, setCheckedIncome] = useState(income.map(t => t.id))
  const [checkedOutcome, setCheckedOutcome] = useState(outcome.map(t => t.id))

  const totalIncome = income
    .filter(t => checkedIncome.includes(t.id))
    .reduce((sum, t) => sum + t.amount, 0)
  const totalOutcome = outcome
    .filter(t => checkedOutcome.includes(t.id))
    .reduce((sum, t) => sum + t.amount, 0)

  const taxes = getTaxes(totalIncome, totalOutcome).sort(
    (a, b) => b.value - a.value
  )
  let totalTaxes = taxes.reduce((sum, t) => round(sum + t.value), 0)

  const taxesRatio = totalTaxes / (totalTaxes + totalIncome)
  const taxMonths = Math.round(taxesRatio * 12 * 10) / 10
  const taxDays = Math.round(taxesRatio * 5 * 10) / 10

  return (
    <>
      <Card sx={{ position: 'relative' }}>
        <IconButton
          onClick={toggleSettings}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <SettingsIcon />
        </IconButton>

        <Stack gap={2} alignItems="center" width="100%">
          <div>
            <Typography variant="body1" align="center">
              Россия забрала {Math.round(taxesRatio * 100)}% вашего дохода
            </Typography>

            <Typography variant="h4" align="center" className="red-gradient">
              ≈<DisplayAmount value={totalTaxes} noShade decMode="ifOnly" />
            </Typography>
          </div>
          <Divider sx={{ width: '100%' }} />
          <Typography variant="body1" align="center">
            <Balancer>
              Целых{' '}
              <b>
                {taxMonths}{' '}
                {pluralize(taxMonths, ['месяц', 'месяца', 'месяцев'])}
              </b>{' '}
              в этом году вы работали исключительно на налоги. Абсолютно
              нормально и правильно требовать выполнения обязательств от тех,
              кому вы платите такие деньги.
            </Balancer>
          </Typography>

          <TaxesChart income={totalIncome} outcome={totalOutcome} />

          <Box textAlign="center">
            {taxes.map(info => (
              <Box m={0.5} display="inline-block" key={info.name}>
                <Tooltip title={info.comment}>
                  <Chip
                    variant={'outlined'}
                    label={
                      <>
                        {info.name} (
                        <DisplayAmount
                          value={info.value}
                          noShade
                          decMode="ifOnly"
                        />
                        )
                      </>
                    }
                  />
                </Tooltip>
              </Box>
            ))}
          </Box>
          <Divider sx={{ width: '100%' }} />
          <Typography variant="body1" align="center">
            <Balancer>
              Подробнее можно посчитать в{' '}
              <Link
                color="secondary"
                href="https://journal.tinkoff.ru/fns-loves-you/"
                target="_blank"
              >
                калькуляторе Тинькофф журнала
              </Link>{' '}
              или посмотрите вот это{' '}
              <Link
                color="secondary"
                href="https://youtu.be/xL8Z1mbcQ78"
                target="_blank"
              >
                видео про налоги
              </Link>{' '}
              (3 мин).
            </Balancer>
          </Typography>
        </Stack>
      </Card>

      {/* Settings */}
      <Dialog open={settings} onClose={() => toggleSettings()}>
        <Stack direction="column" spacing={3} sx={{ p: 3 }}>
          <FormGroup>
            <FormControlLabel
              label="Только операции в рублях"
              control={<Checkbox checked={onlyRUB} onChange={toggleRUB} />}
            />
          </FormGroup>
          <TagSelect
            label="Доходы"
            options={income}
            selected={checkedIncome}
            onChange={setCheckedIncome}
          />

          <TagSelect
            label="Расходы"
            options={outcome}
            selected={checkedOutcome}
            onChange={setCheckedOutcome}
          />
        </Stack>
      </Dialog>
    </>
  )
}

function useIncomeOutcome(onlyRUB: boolean, year: string | number) {
  const yearStats = useStats(year)
  const toDisplay = displayCurrency.useToDisplay('current')
  const tags = useAppSelector(getPopulatedTags)

  return useMemo(() => {
    const incomeTags = entries(yearStats.byTag)
      .map(([id, info]) => {
        let amount = toDisplay(
          onlyRUB ? { RUB: info.income['RUB'] || 0 } : info.income
        )
        return { id, name: tags[id].uniqueName, amount }
      })
      .filter(tagInfo => tagInfo.amount > 0)
      .sort((a, b) => b.amount - a.amount)

    const outcomeTags = entries(yearStats.byTag)
      .map(([id, info]) => {
        let amount = toDisplay(
          onlyRUB ? { RUB: info.outcome['RUB'] || 0 } : info.outcome
        )
        return { id, name: tags[id].uniqueName, amount }
      })
      .filter(tagInfo => tagInfo.amount > 0)
      .sort((a, b) => b.amount - a.amount)

    return { income: incomeTags, outcome: outcomeTags }
  }, [onlyRUB, tags, toDisplay, yearStats.byTag])
}

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
