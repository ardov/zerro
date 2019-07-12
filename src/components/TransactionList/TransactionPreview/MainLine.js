import React from 'react'
import styled from 'styled-components'

const Body = styled.div`
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`
const Tag = styled.span`
  margin-right: 16px;
  overflow: hidden;
  color: rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  text-overflow: ellipsis;

  :first-child {
    color: rgba(0, 0, 0, 0.8);
  }
`
const Account = styled.span`
  overflow: hidden;
  color: rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  text-overflow: ellipsis;

  :first-child::after {
    margin: 0 8px;
    content: '→';
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
