import React from 'react'
import styled, { css } from 'styled-components'
import { MainLine } from './MainLine'
import { Amount } from './Amount'
import Icon from './Icon'

const Body = styled.div`
  display: flex;
  flex-direction: row;
  padding: 16px;
  font-size: 16px;
  line-height: 24px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: 0;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:first-child {
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
  }

  &:last-child {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-bottom-right-radius: 6px;
    border-bottom-left-radius: 6px;
  }

  &:hover {
    background-color: var(--bg-hover);
    opacity: 1;
  }

  ${props =>
    props.deleted &&
    css`
      opacity: 0.3;
    `}

  ${props =>
    props.isOpened &&
    css`
      background-color: rgba(0, 0, 0, 0.1);
      opacity: 1;

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
  align-items: baseline;
  justify-content: space-between;
  min-width: 0;

  :not(:only-child):not(:first-child) {
    margin-top: 4px;
  }
`
const Account = styled.div`
  flex-shrink: 0;
  margin-left: auto;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 16px;
`
const Payee = styled.span`
  min-width: 0;
  margin-right: 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  transition: 0.2s;

  &:hover {
    color: var(--text-primary);
    border-bottom: 1px solid var(--text-secondary);
  }
`

const Comment = styled.span`
  min-width: 0;
  margin-right: 16px;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  text-overflow: ellipsis;
`

export default class Transaction extends React.Component {
  handleOpen = () => this.props.onClick(this.props.id)
  handlePayeeClick = () => this.props.onFilterByPayee(this.props.payee)
  handleSelectSimilar = () => this.props.selectChanged(this.props.changed)

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

      onToggle,
    } = this.props

    const symbol = tag ? tag[0].symbol : type === 'transfer' ? '↔' : '?'
    const color = tag ? tag[0].color : null
    const mainAccountTitle =
      type === 'income' ? incomeAccount.title : outcomeAccount.title

    return (
      <Body
        onClick={this.handleOpen}
        deleted={deleted}
        isOpened={isOpened}
        onDoubleClick={this.handleSelectSimilar}
      >
        <Icon {...{ isChecked, isInSelectionMode, symbol, onToggle, color }} />
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
                opOutcomeInstrument,
              }}
            />
          </Line>
          <Line>
            <Comment title={comment ? comment : ''}>
              {payee && <Payee onClick={this.handlePayeeClick}>{payee}</Payee>}
              {comment}
            </Comment>
            {type !== 'transfer' && <Account>{mainAccountTitle}</Account>}
          </Line>
        </Information>
      </Body>
    )
  }
}
