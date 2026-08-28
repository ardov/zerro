import type { TDateDraft, TFxAmount, TISOMonth } from '6-shared/types'
import { useAppSelector } from 'store'
import { core } from 'zerro-core/redux'

import { useTranslation } from 'react-i18next'
import { ListRows, listItemDenseClass } from '6-shared/ui/ListRow'
import { cn } from '6-shared/ui/shadcn/utils'
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
      <ListRows className="-mx-4 text-muted-foreground">
        {/* Not a button: it reports a number and does nothing when pressed,
            so it keeps the row's box without its affordances. `text-inherit`
            gives the list its muted colour back, which `ListItemButton` used
            to hand down through `ButtonBase`'s `color: inherit`. */}
        <div
          className={cn(
            listItemDenseClass,
            'cursor-default text-inherit hover:bg-transparent'
          )}
        >
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
        </div>

        <button
          type="button"
          className={cn(
            listItemDenseClass,
            'text-inherit transition-colors duration-200 hover:text-foreground'
          )}
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
        </button>

        <button
          type="button"
          className={cn(
            listItemDenseClass,
            'text-inherit transition-colors duration-200 hover:text-foreground'
          )}
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
        </button>
      </ListRows>
    </div>
  )
}
