import type { TTransaction } from '6-shared/types'
import type { FC, ReactNode } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '6-shared/ui/shadcn/utils'
import { TagIcon } from '6-shared/ui/TagIcon'
import { Tooltip } from '6-shared/ui/Tooltip'
import { useAppSelector } from 'store'
import { core } from 'zerro-core/redux'

import { SmartAmount } from '3-widgets/Amount'

type HTMLDivProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>
type TrElementProps = Omit<HTMLDivProps, 'onToggle'> & {
  tr: TTransaction
  trType: core.transactions.TrType
}

type SymbolProps = TrElementProps & {
  isChecked: boolean
  isInSelectionMode: boolean
  onToggle?: (id: string) => void
}

export const Symbol: FC<SymbolProps> = ({
  tr,
  trType,
  isChecked,
  isInSelectionMode,
  onToggle,
}) => {
  const tags = useAppSelector(core.tags.selectPopulated)
  const mainTagId = tr.tag?.length ? tr.tag[0] : 'null'
  const tag = tags[mainTagId]
  const { symbol, color } = getSymAndColor(trType, tag)
  return (
    <SymbolWrapper>
      <TagIcon
        symbol={symbol}
        showCheckBox={isInSelectionMode}
        checked={isChecked}
        onCheckedChange={() => onToggle?.(tr.id)}
        color={color}
        size="m"
      />
      <NewIndicator viewed={core.transactions.isViewed(tr)} />
      {tr.qrCode && <Reciept>🧾</Reciept>}
    </SymbolWrapper>
  )

  function getSymAndColor(
    type: core.transactions.TrType,
    tag: core.tags.TTagPopulated
  ) {
    switch (type) {
      case core.transactions.TrType.Income:
      case core.transactions.TrType.Outcome:
        return { symbol: tag.symbol, color: tag.colorHEX }
      case core.transactions.TrType.Transfer:
        return { symbol: '↔️' }
      case core.transactions.TrType.OutcomeDebt:
        return { symbol: '⬅️' }
      case core.transactions.TrType.IncomeDebt:
        return { symbol: '➡️' }
      default:
        return { symbol: '' }
    }
  }
}

export const Tags: FC<TrElementProps> = ({ tr, trType, ...rest }) => {
  const { t } = useTranslation()
  const tags = useAppSelector(core.tags.selectPopulated)
  switch (trType) {
    case 'income':
    case 'outcome':
      if (!tr.tag?.length)
        return (
          <TagsWrapper {...rest}>
            <NoCategory>{t('noCategory')}</NoCategory>
          </TagsWrapper>
        )
      else
        return (
          <TagsWrapper {...rest}>
            {tr.tag.map(id => (
              <span key={id}>{tags[id]?.name}</span>
            ))}
          </TagsWrapper>
        )
    case 'transfer':
      return <TagsWrapper {...rest}>{t('transfer')}</TagsWrapper>
    case 'outcomeDebt':
    case 'incomeDebt':
      return <TagsWrapper {...rest}>{t('debt')}</TagsWrapper>
    default:
      return null
  }
}

export const Amounts: FC<TrElementProps> = ({ tr, trType, ...rest }) => {
  switch (trType) {
    case 'outcome':
    case 'outcomeDebt':
      return (
        <AmountsWrapper type="outcome" {...rest}>
          {!!tr.opOutcome && !!tr.opOutcomeInstrument && (
            <Tooltip
              title={
                <ExchangeRate
                  sum1={tr.opOutcome}
                  inst1={tr.opOutcomeInstrument}
                  sum2={tr.outcome}
                  inst2={tr.outcomeInstrument}
                />
              }
              placement="top"
            >
              <span className="type-body-sm text-muted-foreground">
                <SmartAmount
                  value={tr.opOutcome}
                  instrument={tr.opOutcomeInstrument}
                  decimals="ifAny"
                />
              </span>
            </Tooltip>
          )}
          <SmartAmount value={tr.outcome} instrument={tr.outcomeInstrument} />
        </AmountsWrapper>
      )
    case 'income':
    case 'incomeDebt':
      return (
        <AmountsWrapper type="income" {...rest}>
          {!!tr.opIncome && !!tr.opIncomeInstrument && (
            <Tooltip
              title={
                <ExchangeRate
                  sum1={tr.opIncome}
                  inst1={tr.opIncomeInstrument}
                  sum2={tr.income}
                  inst2={tr.incomeInstrument}
                />
              }
              placement="top"
            >
              <span className="type-body-sm text-muted-foreground">
                <SmartAmount
                  value={tr.opIncome}
                  instrument={tr.opIncomeInstrument}
                  decimals="ifAny"
                  sign
                />
              </span>
            </Tooltip>
          )}
          <SmartAmount
            value={tr.income}
            instrument={tr.incomeInstrument}
            sign
          />
        </AmountsWrapper>
      )
    case 'transfer': {
      const isEqual =
        tr.income === tr.outcome && tr.incomeInstrument === tr.outcomeInstrument
      return (
        <AmountsWrapper type="transfer" {...rest}>
          {!isEqual && (
            <SmartAmount value={tr.outcome} instrument={tr.outcomeInstrument} />
          )}
          <SmartAmount value={tr.income} instrument={tr.incomeInstrument} />
        </AmountsWrapper>
      )
    }
    default:
      return null
  }
}

type InfoProps = TrElementProps & { onFilterByPayee?: (payee: string) => void }

export const Info: FC<InfoProps> = ({ tr, trType, onFilterByPayee }) => {
  return (
    <InfoWrapper>
      {trType !== 'incomeDebt' && trType !== 'outcomeDebt' && (
        <Payee
          payee={tr.payee}
          merchant={tr.merchant}
          onClick={onFilterByPayee}
        />
      )}
      {!!tr.comment && <span title={tr.comment}>{tr.comment}</span>}
    </InfoWrapper>
  )
}

export const Accounts: FC<InfoProps> = ({
  tr,
  trType,
  onFilterByPayee,
  ...rest
}) => {
  switch (trType) {
    case 'income':
      return (
        <div>
          <Account id={tr.incomeAccount} />
        </div>
      )
    case 'outcome':
      return (
        <div>
          <Account id={tr.outcomeAccount} />
        </div>
      )
    case 'transfer':
      return (
        <AmountsWrapper type="transfer" {...rest}>
          <Account id={tr.outcomeAccount} />
          <Account id={tr.incomeAccount} />
        </AmountsWrapper>
      )
    case 'outcomeDebt':
      return (
        <AmountsWrapper type="transfer" {...rest}>
          <Account id={tr.outcomeAccount} />
          <Payee
            payee={tr.payee}
            merchant={tr.merchant}
            onClick={onFilterByPayee}
          />
        </AmountsWrapper>
      )
    case 'incomeDebt':
      return (
        <AmountsWrapper type="transfer" {...rest}>
          <Payee
            payee={tr.payee}
            merchant={tr.merchant}
            onClick={onFilterByPayee}
          />
          <Account id={tr.incomeAccount} />
        </AmountsWrapper>
      )
    default:
      return null
  }
}

const Account: FC<{ id: string }> = ({ id, ...rest }) => {
  const account = core.accounts.usePopulated()[id]
  return <span {...rest}>{account.title}</span>
}

const Payee: FC<{
  payee: string | null
  merchant: string | null
  onClick?: (payee: string) => void
}> = ({ payee, merchant, onClick, ...rest }) => {
  const merchants = core.merchants.useAll()
  if (!payee && !merchant) return null
  const name = merchant ? merchants[merchant]?.title : payee
  return (
    <PayeeWrapper
      onClick={e => {
        if (onClick) {
          e.preventDefault()
          e.stopPropagation()
          onClick(payee || '')
        }
      }}
      {...rest}
    >
      {name}
    </PayeeWrapper>
  )
}

/** Styles */

const SymbolWrapper: FC<HTMLDivProps> = props => (
  <div {...props} className="relative shrink-0 self-center" />
)

/** The dot on a transaction nobody has looked at yet. It is scaled away
 * rather than unmounted, so that viewing one is animated. */
const NewIndicator: FC<{ viewed?: boolean }> = ({ viewed }) => (
  <div
    className={cn(
      'absolute -top-px -left-0.5 h-3 w-3 scale-100 rounded-full border-2 border-solid border-card bg-error opacity-100 transition-all duration-200',
      viewed && 'scale-0 opacity-0'
    )}
  />
)

/* `text-[1rem]`, not `text-base`: the named size carries a line height with
   it, and this only ever set the size. */
const Reciept: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="absolute -right-1.5 -bottom-[3px] text-[1rem] text-black [text-shadow:0_0_2px_var(--card)]">
    {children}
  </div>
)

const TagsWrapper: FC<HTMLDivProps> = ({ className, ...props }) => (
  <div
    {...props}
    className={cn(
      '[&>:not(:first-of-type)]:ml-2 [&>:not(:first-of-type)]:text-disabled-foreground',
      className
    )}
  />
)

const NoCategory: FC<{ children: ReactNode }> = ({ children }) => (
  <span className="text-error">{children}</span>
)

const amountColors = {
  income: 'text-success',
  transfer: 'text-muted-foreground',
  outcome: 'text-foreground',
}

/** The amounts and, on a transfer, the arrow between them. `data-type` is what
 * `Transaction.css` puts that arrow in; it was a `type` attribute, which is
 * not one a `div` has. */
const AmountsWrapper: FC<
  HTMLDivProps & { type: 'income' | 'outcome' | 'transfer' }
> = ({ type, className, ...props }) => (
  <div
    {...props}
    data-type={type}
    className={cn('transaction-amounts', amountColors[type], className)}
  />
)

const InfoWrapper: FC<HTMLDivProps> = props => (
  <div {...props} className="[&>:not(:first-of-type)]:ml-2" />
)

/** A payee, underlined by a rule of its own rather than by
 * `text-decoration`, so that it can be fainter than the text above it. */
const PayeeWrapper: FC<React.HTMLAttributes<HTMLSpanElement>> = props => (
  <span
    {...props}
    className="relative hover:text-foreground after:absolute after:inset-x-0 after:bottom-0 after:z-[2] after:h-px after:bg-current after:opacity-20 after:transition-all after:duration-150 after:content-['']"
  />
)
type ExchangeRateProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  sum1: number
  inst1: number
  sum2: number
  inst2: number
}
const ExchangeRate: FC<ExchangeRateProps> = props => {
  const { sum1, inst1, sum2, inst2, ...rest } = props
  if (sum1 < sum2) {
    return (
      <span {...rest}>
        <SmartAmount value={1} instrument={inst1} decimals="ifAny" noShade />
         =
        <SmartAmount
          value={sum2 / sum1}
          instrument={inst2}
          decimals="ifAny"
          noShade
        />
      </span>
    )
  } else {
    return (
      <span {...rest}>
        <SmartAmount value={1} instrument={inst2} decimals="ifAny" noShade />
         =
        <SmartAmount
          value={sum1 / sum2}
          instrument={inst1}
          decimals="ifAny"
          noShade
        />
      </span>
    )
  }
}
