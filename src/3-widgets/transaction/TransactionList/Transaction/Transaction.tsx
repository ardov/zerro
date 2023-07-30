import type { TTransaction, TTransactionId } from '6-shared/types'

import React, { FC } from 'react'
import styled from '@emotion/styled'
import { Theme, TypographyVariant } from '@mui/material'
import { sendEvent } from '6-shared/helpers/tracking'
import { EmojiIcon } from '6-shared/ui/EmojiIcon'
import { useAppSelector } from 'store'
import { TrType } from '5-entities/transaction'
import { getPopulatedTags } from '5-entities/tag'
import { Tags, Amounts, Info, Accounts } from './Transaction.Components'
import classes from './Transaction.module.scss'

export type TTransactionProps = {
  id: TTransactionId
  isChecked: boolean
  isOpened: boolean
  isInSelectionMode: boolean
  transaction: TTransaction
  type: TrType
  // Actions
  onOpen?: (id: TTransactionId) => void
  onToggle?: (id: TTransactionId) => void
  onPayeeClick?: (payee: string) => void
  onContextMenu?: (e: React.MouseEvent) => void
}

export const Transaction: FC<TTransactionProps> = props => {
  const {
    id,
    isChecked,
    isOpened,
    isInSelectionMode,
    transaction,
    type,
    onOpen,
    onToggle,
    onPayeeClick: onFilterByPayee,
    onContextMenu,
  } = props

  const tr = transaction
  const trType = type
  const { deleted } = tr

  return (
    <li className={classes.wrapper}>
      <button className={classes.body}>
        <div className={classes.mainRow}>111</div>
      </button>

      <div className={classes.symbol}>
        <Symbol {...{ tr, trType, isChecked, isInSelectionMode, onToggle }} />
        <QRIndicator {...{ tr }} />
      </div>
    </li>
  )

  return (
    <Wrapper
      opened={isOpened}
      deleted={deleted}
      onClick={() => onOpen?.(id)}
      onContextMenu={e => {
        sendEvent('Transaction: open context menu')
        onContextMenu?.(e)
      }}
      onDoubleClick={() => onToggle?.(id)}
    >
      <Symbol {...{ tr, trType, isChecked, isInSelectionMode, onToggle }} />
      <Content>
        <Row color="textPrimary">
          <Tags {...{ tr, trType }} />
          <Amounts {...{ tr, trType }} />
        </Row>
        <SecondaryRow color="textSecondary">
          <Info {...{ tr, trType, onFilterByPayee }} />
          <Accounts {...{ tr, trType, onFilterByPayee }} />
        </SecondaryRow>
      </Content>
    </Wrapper>
  )
}

const Symbol: FC<{
  tr: TTransaction
  trType: TrType
  isChecked: boolean
  isInSelectionMode: boolean
  onToggle?: (id: TTransactionId) => void
}> = props => {
  const { tr, trType, isChecked, isInSelectionMode, onToggle } = props
  const { symbol, color } = useTransactionSymbol(tr, trType)
  return (
    <EmojiIcon
      symbol={symbol}
      color={color}
      showCheckBox={isInSelectionMode}
      checked={isChecked}
      onChange={() => onToggle?.(tr.id)}
      size="m"
    />
  )

  function useTransactionSymbol(tr: TTransaction, trType: TrType) {
    const tags = useAppSelector(getPopulatedTags)
    if (trType === TrType.Transfer) return { symbol: '↔️', color: null }
    if (trType === TrType.OutcomeDebt) return { symbol: '⬅️', color: null }
    if (trType === TrType.IncomeDebt) return { symbol: '➡️', color: null }
    const mainTagId = tr.tag?.length ? tr.tag[0] : 'null'
    const tag = tags[mainTagId]
    return { symbol: tag.symbol, color: tag.colorHEX }
  }
}

const QRIndicator: FC<{ tr: TTransaction }> = props => {
  return props.tr.qrCode ? <div className={classes.qr}>🧾</div> : null
}

export const TagList: FC<{
  tr: TTransaction
  trType: TrType
}> = props => {
  const { tr, trType } = props
  const tags = useAppSelector(getPopulatedTags)
  switch (trType) {
    case TrType.Transfer:
      return <div className={classes.tagList}>Перевод</div>
    case TrType.IncomeDebt:
    case TrType.OutcomeDebt:
      return <div className={classes.tagList}>Долг</div>
    case TrType.Outcome:
    case TrType.Income: {
      if (!tr.tag?.length) {
        return <div className={classes.tagList}>Без категории</div>
      }
      return (
        <div className={classes.tagList}>
          {tr.tag.map(id => (
            <span key={id}>{tags[id]?.name}</span>
          ))}
        </div>
      )
    }
    default:
      return null
  }
}

const Wrapper = styled.div<{ opened: boolean; deleted: boolean }>`
  cursor: pointer;
  position: relative;
  display: flex;
  color: ${p => p.theme.palette.text.primary};
  padding: 12px;
  transition: 0.1s ease-in-out;
  text-decoration: ${p =>
    p.deleted ? 'line-through ' + p.theme.palette.error.main : 'none'};
  ::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: ${p => p.theme.shape.borderRadius}px;
    background-color: ${p =>
      p.opened ? p.theme.palette.action.focus : 'transparent'};
    z-index: -1;
    transition: 0.1s ease-in-out;
  }
  :hover::before {
    ${p =>
      p.opened ? '' : `background-color: ${p.theme.palette.action.hover};`}
  }
  :active::before {
    background-color: ${p => p.theme.palette.action.focus};
  }
`

const Content = styled.div`
  flex-grow: 1;
  margin-left: 16px;
  min-width: 0;
`

const Row = styled.div`
  display: flex;
  color: ${p => p.theme.palette.text.primary};
  ${typography('body1')}
  > * + * {
    margin-left: 12px;
    flex-shrink: 0;
  }
  > *:first-of-type {
    flex-grow: 1;
    min-width: 0;
    position: relative;
    overflow: hidden;
    white-space: nowrap;
    mask-image: linear-gradient(to left, transparent, black 40px);
    -webkit-mask-image: linear-gradient(to left, transparent, black 40px);
  }

  > *:first-child:empty {
    flex-grow: 0;
  }

  > *:empty + * {
    margin-left: 0;
  }
`

const SecondaryRow = styled(Row)`
  margin-top: 4px;
  color: ${p => p.theme.palette.text.secondary};
  ${typography('body2')}
`

function typography(key: TypographyVariant) {
  return (p: { theme: Theme; [x: string]: any }) => `
  font-family: ${p.theme.typography[key].fontFamily};
  font-size: ${p.theme.typography[key].fontSize};
  font-weight: ${p.theme.typography[key].fontWeight};
  line-height: ${p.theme.typography[key].lineHeight};
  `
}
