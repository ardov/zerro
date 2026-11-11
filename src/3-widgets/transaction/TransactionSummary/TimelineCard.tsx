import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts'
import type { TFxCode, TISODate } from '@/6-shared/types'
import { formatDate } from '@/6-shared/helpers/date'
import { round } from '@/6-shared/helpers/money/currencyHelpers'
import { DataLine } from '@/3-widgets/DataLine'
import { InlineButton, cycle } from './shared'
import {
  getSteps,
  getTimeline,
  type TBucket,
  type TEntry,
  type TStep,
} from './model'

const BAR_COLOR = 'var(--info)'
/** Fewer periods with anything in them say nothing the list does not. */
const MIN_FILLED = 3

/** One side over time. The line above the chart reads the period under the
 * pointer, or the average while nothing is pointed at. */
export function TimelineCard(props: {
  entries: readonly TEntry[]
  /** Both sides together: they set the periods, so a side keeps its axis. */
  span: readonly TEntry[]
  currency: TFxCode
  side: ReactNode
  /** Narrows the list to one period. */
  onPeriod?: (from: TISODate, to: TISODate) => void
}) {
  const { entries, span, currency, side, onPeriod } = props
  const { t } = useTranslation('transactionSummary')
  const steps = getSteps(span)
  const [chosen, setChosen] = useState<TStep | null>(null)
  const [pointed, setPointed] = useState<TISODate | null>(null)
  if (!steps) return null
  const step =
    chosen && steps.available.includes(chosen) ? chosen : steps.initial
  const filled = getTimeline(span, step).filter(bucket => bucket.count)
  if (filled.length < MIN_FILLED) return null
  const buckets = getTimeline(entries, step, span)

  const years = new Set(buckets.map(bucket => bucket.from.slice(0, 4))).size
  const label = (bucket: TBucket) => formatBucket(bucket, step, years > 1)
  const current = buckets.find(bucket => bucket.from === pointed)
  const average = round(
    buckets.reduce((total, bucket) => total + bucket.value, 0) / buckets.length
  )

  return (
    <div className="rounded-lg bg-ui-base">
      <div className="flex flex-col gap-3 px-4 pt-4">
        <p className="m-0 text-body">
          {side} {t('by')}{' '}
          {steps.available.length > 1 ? (
            <InlineButton
              onClick={() => setChosen(cycle(steps.available, step))}
            >
              {t(`step_${step}`)}
            </InlineButton>
          ) : (
            t(`step_${step}`)
          )}
        </p>
        <DataLine
          name={current ? label(current) : t(`average_${step}`)}
          color={BAR_COLOR}
          amount={current ? current.value : average}
          currency={currency}
        />
      </div>
      <div className={onPeriod ? 'h-40 w-full cursor-pointer' : 'h-40 w-full'}>
        <ResponsiveContainer>
          <BarChart
            data={buckets}
            margin={{ top: 8, right: 16, left: 16, bottom: 0 }}
            onMouseMove={event =>
              setPointed((event?.activeLabel as TISODate | undefined) ?? null)
            }
            onMouseLeave={() => setPointed(null)}
            onClick={event => {
              const bucket = buckets.find(
                bucket => bucket.from === event?.activeLabel
              )
              if (bucket) onPeriod?.(bucket.from, bucket.to)
            }}
          >
            <Bar dataKey="value" fill={BAR_COLOR} radius={4} />
            <XAxis
              dataKey="from"
              axisLine={false}
              tickLine={false}
              tickFormatter={(from: TISODate) =>
                formatTick(from, step, years > 1)
              }
              minTickGap={8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function formatTick(from: TISODate, step: TStep, manyYears: boolean) {
  if (step === 'year') return formatDate(from, 'yyyy')
  if (step === 'month')
    return formatDate(from, manyYears ? 'LLL yy' : 'LLL').replace('.', '')
  return formatDate(from, 'd MMM').replace('.', '')
}

function formatBucket(bucket: TBucket, step: TStep, manyYears: boolean) {
  const year = manyYears ? ' yyyy' : ''
  if (step === 'year') return formatDate(bucket.from, 'yyyy')
  if (step === 'month') return formatDate(bucket.from, `LLLL${year}`)
  if (step === 'day') return formatDate(bucket.from, `d MMMM${year}`)
  return `${formatDate(bucket.from, 'd MMM')} – ${formatDate(bucket.to, `d MMM${year}`)}`.replace(
    /\./g,
    ''
  )
}
