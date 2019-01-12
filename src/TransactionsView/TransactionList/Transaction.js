import React from 'react'
import styled, { css } from 'styled-components'
import toArray from 'lodash/toArray'
import { FormattedNumber } from 'react-intl'
import { Tag } from 'antd'

function getFirstSymbol(str) {
  return toArray(str)[0]
}
function isEmoji(str) {
  const regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
  return str.match(regex)
}

const Body = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  align-items: flex-start;

  ${props =>
    props.deleted &&
    css`
      opacity: 0.3;
      &:hover {
        opacity: 1;
      }
    `}

  ${props =>
    props.opened &&
    css`
      opacity: 1;
      background-color: #eee;
    `}
`

const Icon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  margin-right: 16px;
  line-height: 40px;
  text-align: center;
  font-size: 24px;
`
const Info = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`
const MainInfo = styled.div`
  display: flex;
  flex-direction: row;
  font-size: 16px;
  line-height: 24px;
`

const MainTag = styled.div`
  flex-grow: 1;
`
const Account = styled.div`
  width: 200px;
`
const Sum = styled.div`
  width: 104px;
  text-align: right;

  ${props =>
    props.type === 'income' &&
    css`
      color: #219653;
    `}
`

const AdditionalInfo = styled.div`
  margin-top: 8px;
  font-size: 12px;
  line-height: 16px;
  color: rgba(0, 0, 0, 0.56);
`

export default class Transaction extends React.Component {
  // static contextType = StoreContext
  render() {
    const tr = this.props.data
    let mainTagTitle = tr.tag ? tr.tag[0].title : 'Без категории'
    const account1 = tr.type === 'income' ? tr.incomeAccount : tr.outcomeAccount
    const amount1 = tr.type === 'income' ? tr.income : tr.outcome
    const instrument1 =
      tr.type === 'income' ? tr.incomeInstrument : tr.outcomeInstrument

    let icon = ''
    if (isEmoji(getFirstSymbol(mainTagTitle))) {
      icon = getFirstSymbol(mainTagTitle)
      let arr = toArray(mainTagTitle)
      arr.shift()
      mainTagTitle = arr.join('').trim()
    }

    return (
      <Body
        onClick={this.props.onClick}
        deleted={tr.deleted}
        opened={this.props.opened}
      >
        <Icon>{icon}</Icon>
        <Info>
          <MainInfo>
            <MainTag>{mainTagTitle}</MainTag>
            <Account>{account1.title}</Account>
            <Sum type={tr.type}>
              <FormattedNumber
                value={amount1}
                style={`currency`}
                currency={instrument1.shortTitle}
                minimumFractionDigits={0}
                maximumFractionDigits={0}
              />
            </Sum>
          </MainInfo>
          <AdditionalInfo>
            {tr.payee && <Tag>{tr.payee}</Tag>} {tr.comment}
          </AdditionalInfo>
        </Info>
      </Body>
    )
  }
}
