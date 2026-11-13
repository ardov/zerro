import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, Cell, XAxis, ResponsiveContainer } from 'recharts'
import type { TFxCode, TISODate } from '@/6-shared/types'
import { formatDate, toISODate } from '@/6-shared/helpers/date'
import { useLocalDay } from '@/6-shared/hooks/useLocalDay'
import { round } from '@/6-shared/helpers/money/currencyHelpers'
import { DataLine } from '@/3-widgets/DataLine'
import { InlineButton } from '@/6-shared/ui/kit/InlineButton'
import { cycle } from './cycle'
import {
  getSteps,
  getTimeline,
  type TBucket,
  type TEntry,
  type TStep,
} from './model'

const BAR_COLOR = 'var(--info)'

/** One side over time. The line above the chart reads the period under the
 * pointer, or the average while nothing is pointed at. Whether to show the
 * card is its owner's call; once shown, no step or side takes it away. */
export function TimelineCard(props: {
  entries: readonly TEntry[]
  /** Both sides together: they set the periods, so a side keeps its axis. */
  span: readonly TEntry[]
  currency: TFxCode
  side: ReactNode
  /** The step last chosen. Ignored once the span no longer offers it. */
  chosen?: string
  onChoose: (step: TStep) => void
  /** Narrows the list to one period. */
  onPeriod?: (from: TISODate, to: TISODate) => void
}) {
  const { entries, span, currency, side, chosen, onChoose, onPeriod } = props
  const { t } = useTranslation('transactionSummary')
  const hatch = useId()
  const today = toISODate(useLocalDay())
  const steps = getSteps(span)
  const [pointed, setPointed] = useState<TISODate | null>(null)
  const step = steps.available.find(step => step === chosen) ?? steps.initial
  const buckets = getTimeline(entries, step, span, today)
  // A period with nothing on either side would narrow the list to nothing.
  const occupied = new Set(
    getTimeline(span, step)
      .filter(bucket => bucket.count)
      .map(bucket => bucket.from)
  )

  const years = new Set(buckets.map(bucket => bucket.from.slice(0, 4))).size
  const label = (bucket: TBucket) => formatBucket(bucket, step, years > 1)
  const current = buckets.find(bucket => bucket.from === pointed)
  // A period still running holds less than it will; counting it would pull
  // the average down for no reason the transactions gave.
  const finished = buckets.filter(bucket => !bucket.ongoing)
  const counted = finished.length ? finished : buckets
  const average = round(
    counted.reduce((total, bucket) => total + bucket.value, 0) / counted.length
  )

  return (
    <div className="rounded-lg bg-ui-base">
      <div className="flex flex-col gap-3 px-4 pt-4">
        <p className="m-0 text-body">
          {side} {t('by')}{' '}
          {steps.available.length > 1 ? (
            <InlineButton
              value={t(`step_${step}`)}
              onClick={() => onChoose(cycle(steps.available, step))}
            />
          ) : (
            t(`step_${step}`)
          )}
        </p>
        <DataLine
          name={
            !current
              ? t(`average_${step}`)
              : current.ongoing
                ? t('ongoing', { period: label(current) })
                : label(current)
          }
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
              if (bucket && occupied.has(bucket.from))
                onPeriod?.(bucket.from, bucket.to)
            }}
          >
            {/* A period still running is hatched: it is not a low one yet. */}
            <defs>
              <pattern
                id={hatch}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="6" height="6" fill={BAR_COLOR} opacity="0.25" />
                <rect width="5" height="6" fill={BAR_COLOR} />
              </pattern>
            </defs>
            <Bar dataKey="value" radius={4} maxBarSize={48}>
              {buckets.map(bucket => (
                <Cell
                  key={bucket.from}
                  fill={bucket.ongoing ? `url(#${hatch})` : BAR_COLOR}
                />
              ))}
            </Bar>
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
