import type { TTransaction } from '6-shared/types'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import styled from '@emotion/styled'
import { Typography } from '@mui/material'
import { TagIcon } from '6-shared/ui/TagIcon'
import { Tooltip } from '6-shared/ui/Tooltip'
import { useAppSelector } from 'store'
import { accountModel } from '5-entities/account'
import { TrType, trModel } from '5-entities/transaction'
import { TTagPopulated, tagModel } from '5-entities/tag'
import { merchantModel } from '5-entities/merchant'
import { SmartAmount } from '3-widgets/Amount'

type HTMLDivProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>
type TrElementProps = HTMLDivProps & {
  tr: TTransaction
  trType: TrType
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
  ...rest
}) => {
  const tags = tagModel.usePopulatedTags()
  const mainTagId = tr.tag?.length ? tr.tag[0] : 'null'
  const tag = tags[mainTagId]
  const { symbol, color } = getSymAndColor(trType, tag)
  return (
    <SymbolWrapper>
      <TagIcon
        symbol={symbol}
        showCheckBox={isInSelectionMode}
        checked={isChecked}
        onChange={() => onToggle?.(tr.id)}
        color={color}
        size="m"
      />
      <NewIndicator viewed={trModel.isViewed(tr)} />
      {tr.qrCode && <Reciept>🧾</Reciept>}
    </SymbolWrapper>
  )

  function getSymAndColor(type: TrType, tag: TTagPopulated) {
    switch (type) {
      case TrType.Income:
      case TrType.Outcome:
        return { symbol: tag.symbol, color: tag.colorHEX }
      case TrType.Transfer:
        return { symbol: '↔️' }
      case TrType.OutcomeDebt:
        return { symbol: '⬅️' }
      case TrType.IncomeDebt:
        return { symbol: '➡️' }
      default:
        return { symbol: '' }
    }
  }
}

export const Tags: FC<TrElementProps> = ({ tr, trType, ...rest }) => {
  const { t } = useTranslation()
  const tags = tagModel.usePopulatedTags()
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
              PopperProps={{ disablePortal: true }}
            >
              <Typography
                variant="body2"
                component="span"
                sx={{
                  color: 'text.secondary',
                }}
              >
                <SmartAmount
                  value={tr.opOutcome}
                  instrument={tr.opOutcomeInstrument}
                  decMode="ifAny"
                />
              </Typography>
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
              PopperProps={{ disablePortal: true }}
            >
              <Typography
                variant="body2"
                color="textSecondary"
                component="span"
              >
                <SmartAmount
                  value={tr.opIncome}
                  instrument={tr.opIncomeInstrument}
                  decMode="ifAny"
                  sign
                />
              </Typography>
            </Tooltip>
          )}
          <SmartAmount
            value={tr.income}
            instrument={tr.incomeInstrument}
            sign
          />
        </AmountsWrapper>
      )
    case 'transfer':
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
    default:
      return null
  }
}

type InfoProps = TrElementProps & { onFilterByPayee?: (payee: string) => void }

export const Info: FC<InfoProps> = ({
  tr,
  trType,
  onFilterByPayee,
  ...rest
}) => {
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
  const account = accountModel.usePopulatedAccounts()[id]
  return <span {...rest}>{account.title}</span>
}

const Payee: FC<{
  payee: string | null
  merchant: string | null
  onClick?: (payee: string) => void
}> = ({ payee, merchant, onClick, ...rest }) => {
  const merchants = merchantModel.useMerchants()
  if (!payee && !merchant) return null
  let name = merchant ? merchants[merchant]?.title : payee
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

const SymbolWrapper = styled.div`
  flex-shrink: 0;
  position: relative;
  align-self: center;
`
const NewIndicator = styled.div<{ viewed?: boolean }>`
  position: absolute;
  left: -2px;
  top: -1px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${p => p.theme.palette.error.main};
  border: solid 2px ${p => p.theme.palette.background.paper};
  transform: scale(${p => (p.viewed ? 0 : 1)});
  opacity: ${p => (p.viewed ? 0 : 1)};
  transition: 200ms;
`
const Reciept = styled.div`
  font-size: ${16 / 16}rem;
  text-shadow: 0 0 2px ${p => p.theme.palette.background.paper};
  color: black;
  position: absolute;
  right: -6px;
  bottom: -3px;
`

const TagsWrapper = styled.div`
  > :not(:first-of-type) {
    margin-left: 8px;
    color: ${p => p.theme.palette.text.disabled};
  }
`
const NoCategory = styled.span`
  color: ${p => p.theme.palette.error.main};
`

const AmountsWrapper = styled.div<{
  type: 'income' | 'outcome' | 'transfer'
}>`
  color: ${p =>
    p.type === 'income'
      ? p.theme.palette.success.main
      : p.type === 'transfer'
        ? p.theme.palette.text.secondary
        : p.theme.palette.text.primary};

  [color='textSecondary'] &[type='transfer'] {
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  > :not(:first-of-type):before {
    content: '${p => (p.type === 'transfer' ? '→' : '')}';
    margin: 0 4px;
  }
`

const InfoWrapper = styled.div`
  > :not(:first-of-type) {
    margin-left: 8px;
  }
`

const PayeeWrapper = styled.span`
  position: relative;

  :hover {
    color: ${p => p.theme.palette.text.primary};
  }
  ::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background-color: currentColor;
    opacity: 0.2;
    z-index: 2;
    transition: 0.16s;
  }
`
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
        <SmartAmount value={1} instrument={inst1} decMode="ifAny" noShade />
         =
        <SmartAmount
          value={sum2 / sum1}
          instrument={inst2}
          decMode="ifAny"
          noShade
        />
      </span>
    )
  } else {
    return (
      <span {...rest}>
        <SmartAmount value={1} instrument={inst2} decMode="ifAny" noShade />
         =
        <SmartAmount
          value={sum1 / sum2}
          instrument={inst1}
          decMode="ifAny"
          noShade
        />
      </span>
    )
  }
}
