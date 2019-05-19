import React from 'react'
import styled, { css } from 'styled-components'
import { Tag } from 'antd'
import { MainLine } from './MainLine'
import { Amount } from './Amount'
import Icon from './Icon'

const Body = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: row;
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
    props.isOpened &&
    css`
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.1);

      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
    `}
`
const Information = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
`
const Line = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
  min-width: 0;
  :not(:only-child):not(:first-child) {
    margin-top: 4px;
  }
`
const Account = styled.div`
  font-size: 12px;
  line-height: 16px;
  color: rgba(0, 0, 0, 0.4);
  margin-left: auto;
`
const StyledTag = styled(Tag)`
  margin-right: 8px;
`

const Comment = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  font-size: 12px;
  line-height: 16px;
  color: rgba(0, 0, 0, 0.5);
  margin-right: 16px;
`

export default class Transaction extends React.Component {
  handleOpen = () => this.props.onClick(this.props.id)
  handlePayeeClick = () => this.props.onFilterByPayee(this.props.payee)

  render() {
    const {
      type,
      incomeAccount,
      deleted,
      outcomeAccount,
      isOpened,
      isInSelectionMode,
      isChecked,
      payee,
      tag,
      comment,

      income,
      incomeInstrument,
      opIncome,
      opIncomeInstrument,
      outcome,
      outcomeInstrument,
      opOutcome,
      opOutcomeInstrument,

      onToggle
    } = this.props

    const symbol = tag ? tag[0].symbol : type === 'transfer' ? '↔' : '?'
    const mainAccountTitle =
      type === 'income' ? incomeAccount.title : outcomeAccount.title

    return (
      <Body onClick={this.handleOpen} deleted={deleted} isOpened={isOpened}>
        <Icon {...{ isChecked, isInSelectionMode, symbol, onToggle }} />
        <Information>
          <Line>
            <MainLine {...{ type, tag, outcomeAccount, incomeAccount }} />
            <Amount
              {...{
                type,
                income,
                incomeInstrument,
                opIncome,
                opIncomeInstrument,
                outcome,
                outcomeInstrument,
                opOutcome,
                opOutcomeInstrument
              }}
            />
          </Line>
          <Line>
            {payee && (
              <StyledTag onClick={this.handlePayeeClick}>{payee}</StyledTag>
            )}
            {comment && <Comment>{comment}</Comment>}
            {type !== 'transfer' && <Account>{mainAccountTitle}</Account>}
          </Line>
        </Information>
      </Body>
    )
  }
}
