import { useTranslation } from 'react-i18next'
import type { TFxCode } from '@/6-shared/types'
import { Amount } from '@/6-shared/ui/Amount'
import { ButtonBase } from '@/6-shared/ui/kit/ButtonBase'
import { Tooltip } from '@/6-shared/ui/kit/Tooltip'
import { DataLine } from '@/3-widgets/DataLine'
import type { TFlowTotal, TSummary } from './model'

/** One headline number, then what it is made of. A single flow is its own
 * headline; several flows add up to a net, and transfers stay beside it. */
export function TotalsCard(props: {
  summary: TSummary
  /** Offered when amounts were converted and another currency can be shown. */
  onCycleCurrency?: () => void
}) {
  const { summary, onCycleCurrency } = props
  const { t } = useTranslation('transactionSummary')
  const { currency, converted } = summary
  const transfers = summary.flows.find(total => total.flow === 'transfer')
  const money = summary.flows.filter(total => total.flow !== 'transfer')
  const headline =
    summary.net !== null
      ? { label: t('net'), value: summary.net, sign: true }
      : money[0]
        ? {
            label: t(`flow_${money[0].flow}`),
            value: money[0].value,
            sign: true,
          }
        : {
            label: t('flow_transfer'),
            value: transfers?.value ?? 0,
            sign: false,
          }
  const single = summary.net === null ? (money[0] ?? transfers) : undefined
  const amount = (
    <span className="text-title-lg">
      {converted && '≈ '}
      <Amount
        value={headline.value}
        currency={currency}
        sign={headline.sign}
        decimals="ifAny"
        noShade
      />
    </span>
  )

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-ui-base p-4">
      <div className="text-center">
        <p className="m-0 text-body-sm text-ui-secondary">{headline.label}</p>
        {converted ? (
          <Tooltip content={t('convertedHint')}>
            <ButtonBase
              className="-mx-2 rounded-lg px-2"
              disabled={!onCycleCurrency}
              onClick={onCycleCurrency}
            >
              {amount}
            </ButtonBase>
          </Tooltip>
        ) : (
          amount
        )}
      </div>

      {(summary.net !== null || converted || (transfers && money[0])) && (
        <hr className="m-0 w-full border-0 border-t border-ui-border" />
      )}

      {summary.net !== null &&
        money.map(total => (
          <FlowLine
            key={total.flow}
            total={total}
            currency={currency}
            converted={converted}
          />
        ))}

      {/* One flow in several currencies: the exact sums are the breakdown. */}
      {single &&
        converted &&
        single.native.map(sum => (
          <DataLine
            key={sum.currency}
            name={sum.currency}
            amount={sum.amount}
            currency={sum.currency}
            sign={single.flow !== 'transfer'}
          />
        ))}

      {transfers && money[0] && (
        <FlowLine
          total={transfers}
          currency={currency}
          converted={converted}
          className="text-ui-secondary"
        />
      )}
    </div>
  )
}

function FlowLine(props: {
  total: TFlowTotal
  currency: TFxCode
  converted: boolean
  className?: string
}) {
  const { total, currency, converted, className } = props
  const { t } = useTranslation('transactionSummary')
  const signed = total.flow !== 'transfer'
  return (
    <div className={className}>
      <DataLine
        name={t(`flow_${total.flow}`)}
        amount={total.value}
        currency={currency}
        sign={signed}
      />
      {/* Exact sums, unless the one sum is the line above. */}
      {converted &&
        (total.native.length > 1 || total.native[0].currency !== currency) && (
          <p className="m-0 text-right text-caption text-ui-secondary">
            {total.native.map((sum, index) => (
              <span key={sum.currency}>
                {index > 0 && ' · '}
                <Amount
                  value={sum.amount}
                  currency={sum.currency}
                  sign={signed}
                  decimals="ifAny"
                  noShade
                />
              </span>
            ))}
          </p>
        )}
    </div>
  )
}
