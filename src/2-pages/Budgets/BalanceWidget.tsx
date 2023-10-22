import { Divider, Paper, Typography } from '@mui/material'
import Balancer from 'react-wrap-balancer'
import { keys } from '6-shared/helpers/keys'
import pluralize from '6-shared/helpers/pluralize'
import { TISOMonth } from '6-shared/types'
import { DataLine } from '3-widgets/DataLine'
import { Total } from '6-shared/ui/Total'

import { displayCurrency } from '5-entities/currency/displayCurrency'
import { balances } from '5-entities/envBalances'

export function BalanceWidget(props: { month: TISOMonth }) {
  const totals = balances.useTotals()[props.month]
  const [currency, setDisplayCurrency] = displayCurrency.useDisplayCurrency()
  const toDisplay = displayCurrency.useToDisplay(props.month)
  const currencies = keys(totals.fundsEnd)
  const currCount = currencies.length

  const cycleForward = () => {
    const idx = currencies.findIndex(c => c === currency)
    const newIdx = (idx + 1) % currencies.length
    if (currencies[newIdx]) setDisplayCurrency(currencies[newIdx])
  }

  // TODO: i18n
  const currString =
    currCount > 1
      ? ` | ${currCount} ${pluralize(currCount, ['валюта', 'валюты', 'валют'])}`
      : ''
  const fundsEnd = toDisplay(totals.fundsEnd)
  const fundsChange = toDisplay(totals.fundsChange)
  const available = toDisplay(totals.available)
  const budgetedInFuture = toDisplay(totals.budgetedInFuture)
  const toBeBudgeted = toDisplay(totals.toBeBudgeted)
  const overspend = toDisplay(totals.overspend)

  const smartBudgetedInFuture = toBeBudgeted < 0 ? 0 : budgetedInFuture

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.default',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Total
        title={'В балансе'}
        value={fundsEnd}
        currency={currency}
        onClick={cycleForward}
      />
      {/* <div>
        <Chip label={currString.trim()} />
        <Chip label={'5 счетов'} />
        <Chip label={formatMoney(fundsChange, displayCurrency)} />
      </div> */}
      <Divider />
      <DataLine
        name="В категориях"
        tooltip="Эта сумма сейчас лежит в категориях (столбец «Доступно»)"
        amount={available}
        currency={currency}
      />
      {!!smartBudgetedInFuture && (
        <DataLine
          name="Отложено на будущее"
          tooltip="Эти деньги зарезервированы под будущие бюджеты"
          amount={smartBudgetedInFuture}
          currency={currency}
        />
      )}
      <DataLine
        name="Свободно"
        tooltip="Нераспределённые деньги"
        amount={toBeBudgeted}
        currency={currency}
      />
      <Divider />
      <Typography variant="body2" color="text.secondary" align="center">
        <Balancer>{getExplaining(fundsEnd, toBeBudgeted, overspend)}</Balancer>
      </Typography>
    </Paper>
  )

  function getExplaining(
    balance: number,
    toBeBudgeted: number,
    overspend: number
  ) {
    if (!!overspend) {
      return 'Добавьте денег в категории с перерасходом.'
    }
    if (toBeBudgeted > 0) {
      return 'Выглядит замечательно! Распределите свободные деньги, чтобы было совсем хорошо.'
    }
    if (balance < 0) {
      return 'Кажется, у вас отрицательный баланс, поэтому распределять нечего. Кредиты лучше всего унести за баланс.'
    }
    if (toBeBudgeted === 0) {
      return 'Все деньги распределены, так держать!'
    }
    return 'Вы разложили по категориям больше денег, чем у вас есть. На что-то может не хватить. Чтобы исправить, выложите излишки из категорий.'
  }
}
