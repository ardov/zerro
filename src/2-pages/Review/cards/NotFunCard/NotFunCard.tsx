import { useTranslation } from 'react-i18next'
import { IconButton } from '@/6-shared/ui/kit/Button'
import { useMemo, useState } from 'react'
import { core } from '@/zerro-core/redux'

import { CheckboxField } from '@/6-shared/ui/kit/Checkbox'
import { Link } from '@/6-shared/ui/kit/Link'
import { Chip } from '@/6-shared/ui/kit/Chip'
import { Dialog } from '@/6-shared/ui/kit/Dialog'
import pluralize from '@/6-shared/helpers/pluralize'
import { round } from '@/6-shared/helpers/money'
import { entries } from '@/6-shared/helpers/keys'
import { useToggle } from '@/6-shared/hooks/useToggle'
import { SettingsIcon } from '@/6-shared/ui/Icons'
import { Tooltip } from '@/6-shared/ui/kit/Tooltip'
import { track } from '@/6-shared/analytics'
import { DisplayAmount } from '@/3-widgets/DisplayAmount'
import type { TCardProps } from '../../shared/Card'
import { Card } from '../../shared/Card'
import { useStats } from '../../shared/getFacts'
import { useAppSelector } from '@/store'

import { TagSelect } from './TagSelect'
import { TaxesChart } from './Chart'
import { getTaxes } from './getTaxesByIncome'

export function NotFunCard(props: TCardProps) {
  const { t: uiT } = useTranslation('common')
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
      <p className="m-0 text-center text-body text-balance">
        Нет доходов — нет налогов 😅
      </p>
    </div>
  )

  const cardContent = (
    <div className="flex w-full flex-col items-center gap-4">
      <TaxesChart income={totalIncome} outcome={totalOutcome} />
      <p className="m-0 text-center text-body text-balance">
        ≈{Math.round(taxesRatio * 100)}% от вашего дохода получила Россия.
      </p>

      <p className="m-0 text-center text-body text-balance">
        <b>
          {taxMonths} {pluralize(taxMonths, ['месяц', 'месяца', 'месяцев'])}
        </b>{' '}
        вы работали исключительно на государство. Если бы не налоги, вы могли бы
        за ту же зарплату работать всего{' '}
        <b>
          {workWeek} {pluralize(workWeek, ['день', 'дня', 'дней'])}
        </b>{' '}
        в неделю.
      </p>

      <p className="m-0 text-center text-body text-balance">
        Если вы тратите столько времени на государство, значит абсолютно
        нормально и правильно требовать от него выполнения обязательств.
      </p>

      <hr className="m-0 w-full border-0 border-t border-ui-border" />

      <div>
        <p className="m-0 text-center text-body">Россия получила от вас</p>
        <h2 className="red-gradient m-0 text-center text-display">
          ≈<DisplayAmount value={totalTaxes} noShade decimals="ifOnly" />
        </h2>
      </div>

      <div className="text-center">
        {taxes.map(info => (
          <span key={info.name} className="m-1 inline-block">
            <Tooltip content={info.comment}>
              <Chip variant="outline">
                {info.name} (
                <DisplayAmount value={info.value} noShade decimals="ifOnly" />)
              </Chip>
            </Tooltip>
          </span>
        ))}
      </div>
      <hr className="m-0 w-full border-0 border-t border-ui-border" />
      <p className="m-0 text-center text-body text-balance">
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
      </p>
    </div>
  )

  return (
    <>
      <Card className="relative">
        <Dialog
          title={uiT('navigation:settings')}
          trigger={
            <IconButton
              label={uiT('navigation:settings')}
              variant="ghost"
              size="sm"
              onClick={() =>
                track('external_link_opened', {
                  destination: 'taxes_settings',
                })
              }
              className="absolute right-2 top-2"
            >
              <SettingsIcon />
            </IconButton>
          }
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col">
              <CheckboxField
                label="Только операции в рублях"
                checked={onlyRUB}
                onCheckedChange={() => toggleRUB()}
              />
            </div>
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

        {totalIncome ? cardContent : emptyCardContent}
      </Card>
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
