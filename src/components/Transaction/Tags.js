import React from 'react'
import styled from 'styled-components'

const Tag = styled.span`
  color: ${props => (props.main ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.3)')};
  margin-right: 16px;
`
const NoTag = styled.span`
  color: #cc1414;
`
const Transfer = styled.span`
  color: rgba(0, 0, 0, 0.5);
`
const Body = styled.div`
  grid-area: tag;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  /* flex-grow: 1; */
`

export function Tags({ type, mainTagTitle, secondaryTagTitles }) {
  if (type === 'transfer') {
    return (
      <Body>
        <Transfer>Перевод</Transfer>
      </Body>
    )
  } else if (mainTagTitle === 'Без категории') {
    return (
      <Body>
        <NoTag>Без категории</NoTag>
      </Body>
    )
  } else {
    return (
      <Body>
        <Tag main>{mainTagTitle}</Tag>
        {secondaryTagTitles.map(title => (
          <Tag key={title}>{title}</Tag>
        ))}
      </Body>
    )
  }
}
