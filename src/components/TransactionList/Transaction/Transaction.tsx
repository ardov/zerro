import React, { FC } from 'react'
import styled from '@emotion/styled'
import { Transaction as ITransaction, TTransactionType } from 'types'
import { Theme, TypographyVariant } from '@mui/material'
import { Symbol, Tags, Amounts, Info, Accounts } from './Transaction.Components'
import { sendEvent } from 'helpers/tracking'

type TransactionProps = {
  id: string
  transaction: ITransaction
  type: TTransactionType
  isInSelectionMode: boolean
  isChecked: boolean
  isOpened: boolean
  onClick?: (id: string) => void
  onToggle: (id: string) => void
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  onFilterByPayee: (payee: string) => void
}

export const Transaction: FC<TransactionProps> = props => {
  const {
    id,
    transaction,
    type,
    isInSelectionMode,
    isChecked,
    isOpened,
    onClick,
    onToggle,
    onContextMenu,
    onFilterByPayee,
  } = props

  const tr = transaction
  const trType = type
  const { deleted } = tr

  const handleOpen = () => {
    onClick?.(id)
  }

  return (
    <Wrapper
      opened={isOpened}
      deleted={deleted}
      onClick={handleOpen}
      onContextMenu={e => {
        sendEvent('Transaction: open context menu')
        onContextMenu?.(e)
      }}
      onDoubleClick={() => onToggle(id)}
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
