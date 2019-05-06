import React from 'react'
import styled, { css } from 'styled-components'
import { Tag } from 'antd'
import { Tags } from './Tags'
import toArray from 'lodash/toArray'

const Body = styled.div`
  padding: 16px;
  display: grid;
  grid-template-columns: 40px 1fr 1fr 104px;
  grid-template-areas:
    'icon tag account amount'
    'icon info info info';
  column-gap: 16px;
  row-gap: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: none;
  transition: all 0.2s ease-in-out;
  font-size: 16px;
  line-height: 24px;
  cursor: pointer;

  &:first-child {
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
  }
  &:last-child {
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  &:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.04);
  }
  ${props =>
    props.deleted &&
    css`
      opacity: 0.3;
    `}
  ${props =>
    props.isSelected &&
    css`
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.1);

      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
    `}
`
const Icon = styled.div`
  grid-area: icon;
  margin-top: -8px;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  color: #000;
  line-height: 40px;
  text-align: center;
  font-size: 24px;
`
const colors = {
  income: '#21A355',
  outcome: 'rgba(0, 0, 0, 0.8)',
  transfer: 'rgba(0, 0, 0, 0.5)'
}

const Amount = styled.div`
  grid-area: amount;
  text-align: right;
  color: ${props => colors[props.type]};
`

const Account = styled.div`
  grid-area: account;
  align-self: flex-end;
`

const AdditionalInfo = styled.div`
  grid-area: info;
  font-size: 12px;
  line-height: 16px;
  color: rgba(0, 0, 0, 0.5);
`

export default class Transaction extends React.Component {
  handleSelect = () => this.props.onClick(this.props.id)
  handlePayeeClick = () => this.props.onFilterByPayee(this.props.payee)

  render() {
    console.log('Render trans')
    const props = this.props
    const {
      type,
      incomeAccount,
      deleted,
      outcomeAccount,
      isSelected,
      payee,
      tag,
      comment
    } = props

    const mainTagTitle =
      type === 'transfer' ? 'Перевод' : tag ? tag[0].title : 'Без категории'
    const secondaryTagTitles = tag && tag.map(tag => tag.title).splice(1)
    const iconSymbol = getTagIcon(type, tag)
    const amount = getAmount(props)
    const mainAccountTitle =
      type === 'income' ? incomeAccount.title : outcomeAccount.title

    return (
      <Body
        onClick={this.handleSelect}
        deleted={deleted}
        isSelected={isSelected}
      >
        <Icon>{iconSymbol}</Icon>
        <Tags {...{ type, mainTagTitle, secondaryTagTitles }} />
        <Account>{mainAccountTitle.title}</Account>
        <Amount type={type}>{amount}</Amount>
        {(payee || comment) && (
          <AdditionalInfo>
            {payee && <Tag onClick={this.handlePayeeClick}>{payee}</Tag>}{' '}
            {comment}
          </AdditionalInfo>
        )}
      </Body>
    )
  }
}

function getTagIcon(type, tag) {
  if (type === 'transfer') return '↔'
  if (!tag) return
  return toArray(tag[0].title)[0]
}

function getAmount(data) {
  const { type, income, outcome, incomeInstrument, outcomeInstrument } = data
  const amount1 = type === 'income' ? income : outcome
  const instrument1 = type === 'income' ? incomeInstrument : outcomeInstrument
  const sym = type === 'income' ? '+' : type === 'outcome' ? '−' : ''
  const formatMoney = new Intl.NumberFormat('ru', {
    style: 'currency',
    currency: instrument1.shortTitle,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format

  return sym + formatMoney(amount1)
}

// function isEmoji(str) {
//   const regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
//   return str.match(regex)
// }
