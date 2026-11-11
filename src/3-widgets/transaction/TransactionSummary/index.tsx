import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFxCode, TISODate, TTransactionId } from '@/6-shared/types'
import { IconButton } from '@/6-shared/ui/kit/Button'
import { CloseIcon } from '@/6-shared/ui/Icons'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { useListTransactions } from '../TransactionList/useListTransactions'
import { upsertFilter } from '../TransactionList/TopBar/filterModel'
import { getDateFilterLabel } from '../TransactionList/TopBar/dateFilterLabel'
import { BreakdownCard } from './BreakdownCard'
import { TimelineCard } from './TimelineCard'
import { TotalsCard } from './TotalsCard'
import { InlineButton, cycle } from './shared'
import {
  getDimensions,
  isSpreadOverTime,
  summarize,
  type TSide,
  type TSummaryContext,
} from './model'

type Query = core.transactions.TTransactionQuery
type Clause = core.transactions.TTransactionFilterClause

/** Fewer checked rows are already read at a glance in the list itself. */
const MIN_CHECKED_FOR_DETAILS = 3

export type TransactionSummaryProps = {
  /** The list's own scope, as `TransactionList` takes it. */
  transactionIds?: TTransactionId[]
  query: Query
  search: string
  /** Checked rows. Any of them make the summary about them alone. */
  checked: TTransactionId[]
  /** Lets a group or a period narrow the list. */
  onQueryChange?: (query: Query) => void
  onClose?: () => void
}

/** What a list adds up to: its checked rows when there are any, otherwise
 * everything its filter shows.
 *
 * A filtered list always has all three cards. They are how the list is
 * narrowed, so narrowing it, or switching anything inside a card, must never
 * take a card away. A few checked rows are only there to be added up: for
 * them a card appears once the rows give it something to say. */
export function TransactionSummary(props: TransactionSummaryProps) {
  const { transactionIds, query, search, checked, onQueryChange, onClose } =
    props
  const { t, i18n } = useTranslation('transactionSummary')
  const listed = useListTransactions(transactionIds, query, search)
  const all = useAppSelector(core.transactions.selectAll)
  const selected = useMemo(
    () =>
      checked
        .map(id => all[id])
        .filter(
          (transaction): transaction is NonNullable<typeof transaction> =>
            !!transaction
        ),
    [checked, all]
  )
  const selection = selected.length > 0
  const transactions = selection ? selected : listed

  const ctx = useSummaryContext()
  const displayCurrency = useAppSelector(core.currency.selectDisplayCurrency)
  const [chosenCurrency, setChosenCurrency] = useState<TFxCode | null>(null)
  const [chosenSide, setChosenSide] = useState<TSide | null>(null)
  const summary = useMemo(
    () => summarize(transactions, chosenCurrency ?? displayCurrency, ctx),
    [transactions, chosenCurrency, displayCurrency, ctx]
  )
  const currencies = [...new Set([displayCurrency, ...summary.currencies])]

  const side =
    chosenSide && summary.sides.includes(chosenSide)
      ? chosenSide
      : summary.sides[0]
  // Cards are decided by both sides together and only filled by the one in
  // view, so switching sides never takes a card, or the switch, away.
  const sided = useMemo(
    () =>
      summary.sides.map(flow =>
        summary.entries.filter(entry => entry.flow === flow)
      ),
    [summary]
  )
  const entries = sided[summary.sides.indexOf(side)] ?? []
  const span = useMemo(() => sided.flat(), [sided])
  const dimensions = getDimensions(...sided)
  const details = selection ? span.length >= MIN_CHECKED_FOR_DETAILS : true
  const showBreakdown = !selection || dimensions.length > 0
  const showTimeline = !selection || isSpreadOverTime(span)
  const sideLabel =
    summary.sides.length > 1 ? (
      <InlineButton onClick={() => setChosenSide(cycle(summary.sides, side))}>
        {t(`flow_${side}`)}
      </InlineButton>
    ) : (
      side && t(`flow_${side}`)
    )

  // A selection is not what the filter shows, so narrowing it means nothing.
  const narrow =
    onQueryChange && !selection
      ? (clause: Clause) => {
          const amount = query.clauses.find(item => item.kind === 'amount')
          onQueryChange(
            upsertFilter(
              query,
              // A currency joins the bounds of an amount filter already set.
              clause.kind === 'amount' ? { ...amount, ...clause } : clause
            )
          )
        }
      : undefined

  return (
    <div className="flex min-h-full min-w-0 grow flex-col bg-ui-card text-ui-primary">
      <header className="flex items-start gap-1 px-6 pt-4">
        <div className="min-w-0 grow">
          <h2 className="m-0 text-title">{t('title')}</h2>
          <p className="m-0 text-body-sm text-ui-secondary">
            {t(selection ? 'selected' : 'listed', { count: summary.count })}
            {summary.range &&
              ` · ${getDateFilterLabel(
                { kind: 'date', ...summary.range },
                t,
                i18n.language
              )}`}
          </p>
        </div>
        {onClose && (
          <IconButton
            variant="ghost"
            size="sm"
            label={t('common:close')}
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        )}
      </header>

      {summary.count > 0 && (
        <div className="flex flex-col gap-4 p-6">
          <TotalsCard
            summary={summary}
            onCycleCurrency={
              currencies.length > 1
                ? () => setChosenCurrency(cycle(currencies, summary.currency))
                : undefined
            }
          />
          {side && details && showBreakdown && (
            <BreakdownCard
              entries={entries}
              dimensions={dimensions}
              currency={summary.currency}
              side={sideLabel}
              onFilter={narrow}
            />
          )}
          {side && details && showTimeline && (
            <TimelineCard
              entries={entries}
              span={span}
              currency={summary.currency}
              side={sideLabel}
              onPeriod={
                narrow &&
                ((from: TISODate, to: TISODate) =>
                  narrow({ kind: 'date', from, to }))
              }
            />
          )}
        </div>
      )}
    </div>
  )
}

function useSummaryContext(): TSummaryContext {
  const debtAccountId = useAppSelector(core.accounts.selectDebtAccountId)
  const codes = useAppSelector(core.instruments.selectCodeMap)
  const convert = useAppSelector(core.currency.selectConvertFx)
  return useMemo(() => {
    // Rates are kept by month, so one lookup serves a month of transactions.
    const rates = new Map<string, number>()
    return {
      debtAccountId,
      currencyOf: instrument => codes[instrument],
      rate: (from, to, date) => {
        if (from === to) return 1
        const key = `${from}|${to}|${date.slice(0, 7)}`
        let rate = rates.get(key)
        if (rate === undefined) {
          rate = convert({ [from]: 1 }, to, date, 'unrounded')
          if (!Number.isFinite(rate)) rate = 0
          rates.set(key, rate)
        }
        return rate
      },
    }
  }, [debtAccountId, codes, convert])
}
