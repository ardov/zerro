import { IconButton } from '6-shared/ui/Button'
import { useMemo, useState } from 'react'
import { core } from 'zerro-core/redux'

import {
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  Link,
} from '@mui/material'
import { Dialog } from '6-shared/ui/Dialog'
import Balancer from 'react-wrap-balancer'
import pluralize from '6-shared/helpers/pluralize'
import { round } from '6-shared/helpers/money'
import { entries } from '6-shared/helpers/keys'
import { useToggle } from '6-shared/hooks/useToggle'
import { SettingsIcon } from '6-shared/ui/Icons'
import { Tooltip } from '6-shared/ui/Tooltip'
import { track } from '6-shared/analytics'
import { DisplayAmount } from '3-widgets/DisplayAmount'
import type { TCardProps } from '../../shared/Card'
import { Card } from '../../shared/Card'
import { useStats } from '../../shared/getFacts'
import { useAppSelector } from 'store'

import { TagSelect } from './TagSelect'
import { TaxesChart } from './Chart'
import { getTaxes } from './getTaxesByIncome'

export function NotFunCard(props: TCardProps) {
  const [settings, toggleSettings] = useToggle(false)
  const [onlyRUB, toggleRUB] = useToggle(false)
  const { income, outcome } = useIncomeOutcome(onlyRUB, props.year)
  const [checkedIncome, setCheckedIncome] = useState(income.map(t => t.id))
  const [checkedOutcome, setCheckedOutcome] = useState(outcome.map(t => t.id))

  const [displayCurr] = core.currency.useDisplayCurrency()
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
  const totalTaxes = taxes.reduce((sum, t) => round(sum + t.value), 0)

  const taxesRatio = totalTaxes / (totalTaxes + totalIncome)
  const taxMonths = Math.round(taxesRatio * 12 * 10) / 10
  const workWeek = Math.round((1 - taxesRatio) * 5 * 10) / 10

  const emptyCardContent = (
    <div className="flex w-full flex-col items-center gap-4">
      <Balancer>
        <p className="m-0 text-center type-body">
          Нет доходов — нет налогов 😅
        </p>
      </Balancer>
    </div>
  )

  const cardContent = (
    <div className="flex w-full flex-col items-center gap-4">
      <TaxesChart income={totalIncome} outcome={totalOutcome} />
      <Balancer>
        <p className="m-0 text-center type-body">
          ≈{Math.round(taxesRatio * 100)}% от вашего дохода получила Россия.
        </p>
      </Balancer>
      <Balancer>
        <p className="m-0 text-center type-body">
          <b>
            {taxMonths} {pluralize(taxMonths, ['месяц', 'месяца', 'месяцев'])}
          </b>{' '}
          вы работали исключительно на государство. Если бы не налоги, вы могли
          бы за ту же зарплату работать всего{' '}
          <b>
            {workWeek} {pluralize(workWeek, ['день', 'дня', 'дней'])}
          </b>{' '}
          в неделю.
        </p>
      </Balancer>
      <Balancer>
        <p className="m-0 text-center type-body">
          Если вы тратите столько времени на государство, значит абсолютно
          нормально и правильно требовать от него выполнения обязательств.
        </p>
      </Balancer>

      <hr className="m-0 w-full border-0 border-t border-border" />

      <div>
        <p className="m-0 text-center type-body">Россия получила от вас</p>
        <h2 className="red-gradient m-0 text-center type-display">
          ≈<DisplayAmount value={totalTaxes} noShade decimals="ifOnly" />
        </h2>
      </div>

      <div className="text-center">
        {taxes.map(info => (
          <span key={info.name} className="m-1 inline-block">
            <Tooltip title={info.comment}>
              <Chip
                variant={'outlined'}
                label={
                  <>
                    {info.name} (
                    <DisplayAmount
                      value={info.value}
                      noShade
                      decimals="ifOnly"
                    />
                    )
                  </>
                }
              />
            </Tooltip>
          </span>
        ))}
      </div>
      <hr className="m-0 w-full border-0 border-t border-border" />
      <p className="m-0 text-center type-body">
        <Balancer>
          Это приблизительные цифры, подробнее можно посчитать в{' '}
          <Link
            color="secondary"
            href="https://journal.tinkoff.ru/fns-loves-you/"
            target="_blank"
            onClick={() =>
              track('external_link_opened', {
                destination: 'taxes_calculator',
              })
            }
          >
            калькуляторе Тинькофф журнала
          </Link>{' '}
          или посмотрите вот это{' '}
          <Link
            color="secondary"
            href="https://youtu.be/xL8Z1mbcQ78"
            target="_blank"
            onClick={() =>
              track('external_link_opened', { destination: 'taxes_video' })
            }
          >
            видео про налоги
          </Link>{' '}
          (3 мин).
        </Balancer>
      </p>
    </div>
  )

  return (
    <>
      <Card className="relative">
        <IconButton
          onClick={() => {
            track('external_link_opened', { destination: 'taxes_settings' })
            toggleSettings()
          }}
          className="absolute right-2 top-2"
        >
          <SettingsIcon />
        </IconButton>

        {totalIncome ? cardContent : emptyCardContent}
      </Card>

      {/* Settings */}
      <Dialog open={settings} onClose={() => toggleSettings()}>
        <div className="flex flex-col gap-6 p-6">
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
        </div>
      </Dialog>
    </>
  )
}

function useIncomeOutcome(onlyRUB: boolean, year: string | number) {
  const yearStats = useStats(year)
  const toDisplay = core.currency.useToDisplay('current')
  const tags = useAppSelector(core.tags.selectPopulated)

  return useMemo(() => {
    const incomeTags = entries(yearStats.byTag)
      .map(([id, info]) => {
        const amount = toDisplay(
          onlyRUB ? { RUB: info.income['RUB'] || 0 } : info.income
        )
        return { id, name: tags[id].uniqueName, amount }
      })
      .filter(tagInfo => tagInfo.amount > 0)
      .sort((a, b) => b.amount - a.amount)

    const outcomeTags = entries(yearStats.byTag)
      .map(([id, info]) => {
        const amount = toDisplay(
          onlyRUB ? { RUB: info.outcome['RUB'] || 0 } : info.outcome
        )
        return { id, name: tags[id].uniqueName, amount }
      })
      .filter(tagInfo => tagInfo.amount > 0)
      .sort((a, b) => b.amount - a.amount)

    return { income: incomeTags, outcome: outcomeTags }
  }, [onlyRUB, tags, toDisplay, yearStats.byTag])
}
