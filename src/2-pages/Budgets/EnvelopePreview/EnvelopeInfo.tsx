import type { TDateDraft, TFxAmount, TISOMonth } from '6-shared/types'
import { useAppSelector } from 'store'
import { core } from 'zerro-core/redux'

import { useTranslation } from 'react-i18next'
import { List, ListItem, ListItemButton } from '@mui/material'
import { Total } from '6-shared/ui/Total'
import { Amount } from '6-shared/ui/Amount'
import {
  formatDate,
  parseDate,
  prevMonth,
  toISOMonth,
} from '6-shared/helpers/date'

import { useEnvTransactionsDrawer } from '3-widgets/global/EnvTransactionsDrawer'
import { OneLiner } from '3-widgets/DataLine'
import { useBudgetPopover } from '../BudgetPopover'

type MonthContext = `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`

const getMonthNum = (month: TISOMonth | TDateDraft) =>
  parseDate(month).getMonth() + 1
const getMonthContext = (month: TISOMonth | TDateDraft): MonthContext =>
  String(getMonthNum(month)) as MonthContext

export function EnvelopeInfo(props: {
  month: TISOMonth
  id: core.envelopes.TEnvelopeId
}) {
  const { month, id } = props
  const { t } = useTranslation('budgets')
  const transactionDrawer = useEnvTransactionsDrawer()
  const openBudgetPopover = useBudgetPopover()
  const convertFx = useAppSelector(core.currency.selectConvertFx)
  const envMetrics = useAppSelector(core.activity.selectEnvelopeMetrics)[month][
    id
  ]

  if (!envMetrics) return null

  const { currency } = envMetrics
  const toEnvelope = (a: TFxAmount) => convertFx(a, currency, month)
  const totalLeftover = toEnvelope(envMetrics.totalLeftover)
  const totalAssigned = toEnvelope(envMetrics.totalAssigned)
  const totalActivity = toEnvelope(envMetrics.totalActivity)
  const totalAvailable = toEnvelope(envMetrics.totalAvailable)

  const currentMonth = toISOMonth(new Date())

  const blockTitle =
    currentMonth === month
      ? t('availableTitleNow')
      : month > currentMonth
        ? t('availableTitleFuture', { context: getMonthContext(month) })
        : t('availableTitlePast', { context: getMonthContext(month) })

  return (
    <div className="w-full rounded-lg bg-background px-4 py-2">
      <div className="flex flex-col gap-3 py-2">
        <Total
          title={blockTitle}
          value={totalAvailable}
          decimals="ifAny"
          currency={currency}
          noShade
          amountColor={
            totalAvailable < 0
              ? 'error'
              : totalAvailable > 0
                ? 'success'
                : undefined
          }
        />
        <hr className="m-0 w-full border-0 border-t border-border opacity-60" />
      </div>
      <List dense className="-mx-4 text-muted-foreground">
        <ListItem>
          <OneLiner
            left={t('leftoverFrom', {
              month: formatDate(prevMonth(month), 'MMM'),
            })}
            right={
              <Amount
                value={totalLeftover}
                currency={currency}
                decimals="ifAny"
              />
            }
          />
        </ListItem>

        <ListItemButton
          className="transition-colors duration-200 hover:text-foreground"
          onClick={e => openBudgetPopover(id, e.currentTarget)}
        >
          <OneLiner
            left={t('assigned', { ns: 'common' })}
            right={
              <Amount
                value={totalAssigned}
                currency={currency}
                decimals="ifAny"
              />
            }
          />
        </ListItemButton>

        <ListItemButton
          className="transition-colors duration-200 hover:text-foreground"
          onClick={() => {
            transactionDrawer.open({
              envelopeConditions: {
                id,
                month,
                mode: core.transactions.TrFilterMode.Envelope,
              },
            })
          }}
        >
          <OneLiner
            left={
              <span>
                <span>{t('transactions', { ns: 'common' })}</span>
                {Boolean(envMetrics.totalTransactionCount) && (
                  <span style={{ opacity: 0.5 }}>
                    {' ' + envMetrics.totalTransactionCount}
                  </span>
                )}
              </span>
            }
            right={
              <Amount
                value={totalActivity}
                currency={currency}
                decimals="ifAny"
              />
            }
          />
        </ListItemButton>
      </List>
    </div>
  )
}
