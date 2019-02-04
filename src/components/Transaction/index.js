import React from 'react'
import styled, { css } from 'styled-components'
import { Tag } from 'antd'
import { Tags } from './Tags'
import { Amount } from './Amount'
import { Icon } from './Icon'

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

export default function Transaction(props) {
  const tr = props.tr
  // let mainTagTitle =
  //   tr.type === 'transfer'
  //     ? 'Перевод'
  //     : tr.tag
  //     ? tr.tag[0].title
  //     : 'Без категории'
  const account1 = tr.type === 'income' ? tr.incomeAccount : tr.outcomeAccount

  return (
    <Body
      onClick={() => {
        props.onClick(props.id)
      }}
      deleted={tr.deleted}
      isSelected={tr.isSelected}
    >
      <Icon data={tr} />
      <Tags data={tr} />
      <Account>{account1.title}</Account>
      <Amount data={tr} />
      {(tr.payee || tr.comment) && (
        <AdditionalInfo>
          {tr.payee && (
            <Tag
              onClick={() => {
                props.onFilterByPayee(tr.payee)
              }}
            >
              {tr.payee}
            </Tag>
          )}{' '}
          {tr.comment}
        </AdditionalInfo>
      )}
    </Body>
  )
}
