import React from 'react'
import styled from 'styled-components'

const Body = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`
const Tag = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(0, 0, 0, 0.3);
  margin-right: 16px;
  :first-child {
    color: rgba(0, 0, 0, 0.8);
  }
`
const Account = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(0, 0, 0, 0.8);
  :first-child::after {
    content: '→';
    margin: 0 8px;
  }
`

export function MainLine({ type, tag, outcomeAccount, incomeAccount }) {
  if (type === 'transfer') {
    return (
      <Body>
        <Account>{outcomeAccount.title}</Account>
        <Account>{incomeAccount.title}</Account>
      </Body>
    )
  } else if (tag) {
    return (
      <Body>
        {tag.map(tag => (
          <Tag key={tag.id}>{tag.title}</Tag>
        ))}
      </Body>
    )
  } else {
    return (
      <Body>
        <Tag main>Без категории</Tag>
      </Body>
    )
  }
}
