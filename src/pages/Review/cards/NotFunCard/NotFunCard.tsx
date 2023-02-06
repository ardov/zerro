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
import { round } from '@shared/helpers/money'
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
import { sendEvent } from '@shared/helpers/tracking'

export function NotFunCard(props: TCardProps) {
  const [settings, toggleSettings] = useToggle(false)
  const [onlyRUB, toggleRUB] = useToggle(false)
  const { income, outcome } = useIncomeOutcome(onlyRUB, props.year)
  const [checkedIncome, setCheckedIncome] = useState(income.map(t => t.id))
  const [checkedOutcome, setCheckedOutcome] = useState(outcome.map(t => t.id))

  const [displayCurr] = displayCurrency.useDisplayCurrency()
  if (displayCurr !== 'RUB') return null

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
  const workWeek = Math.round((1 - taxesRatio) * 5 * 10) / 10

  const emptyCardContent = (
    <Stack gap={2} alignItems="center" width="100%">
      <Balancer>
        <Typography variant="body1" align="center">
          Нет доходов — нет налогов 😅
        </Typography>
      </Balancer>
    </Stack>
  )

  const cardContent = (
    <Stack gap={2} alignItems="center" width="100%">
      <TaxesChart income={totalIncome} outcome={totalOutcome} />
      <Balancer>
        <Typography variant="body1" align="center">
          ≈{Math.round(taxesRatio * 100)}% от вашего дохода получила Россия.
        </Typography>
      </Balancer>
      <Balancer>
        <Typography variant="body1" align="center">
          <b>
            {taxMonths} {pluralize(taxMonths, ['месяц', 'месяца', 'месяцев'])}
          </b>{' '}
          вы работали исключительно на государство. Если бы не налоги, вы могли
          бы за ту же зарплату работать всего{' '}
          <b>
            {workWeek} {pluralize(workWeek, ['день', 'дня', 'дней'])}
          </b>{' '}
          в неделю.
        </Typography>
      </Balancer>
      <Balancer>
        <Typography variant="body1" align="center">
          Если вы тратите столько времени на государство, значит абсолютно
          нормально и правильно требовать от него выполнения обязательств.
        </Typography>
      </Balancer>

      <Divider sx={{ width: '100%' }} />

      <div>
        <Typography variant="body1" align="center">
          Россия получила от вас
        </Typography>
        <Typography variant="h4" align="center" className="red-gradient">
          ≈<DisplayAmount value={totalTaxes} noShade decMode="ifOnly" />
        </Typography>
      </div>

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
          Это приблизительные цифры, подробнее можно посчитать в{' '}
          <Link
            color="secondary"
            href="https://journal.tinkoff.ru/fns-loves-you/"
            target="_blank"
            onClick={() => sendEvent('Review: go_to_taxes_calculator')}
          >
            калькуляторе Тинькофф журнала
          </Link>{' '}
          или посмотрите вот это{' '}
          <Link
            color="secondary"
            href="https://youtu.be/xL8Z1mbcQ78"
            target="_blank"
            onClick={() => sendEvent('Review: go_to_taxes_video')}
          >
            видео про налоги
          </Link>{' '}
          (3 мин).
        </Balancer>
      </Typography>
    </Stack>
  )

  return (
    <>
      <Card sx={{ position: 'relative' }}>
        <IconButton
          onClick={() => {
            sendEvent('Review: open_taxes_settings')
            toggleSettings()
          }}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <SettingsIcon />
        </IconButton>

        {totalIncome ? cardContent : emptyCardContent}
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
