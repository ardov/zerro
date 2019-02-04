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

export function Tags({ data }) {
  const { type, tag } = data
  if (type === 'transfer') {
    return (
      <Body>
        <Transfer>Перевод</Transfer>
      </Body>
    )
  } else if (!tag) {
    return (
      <Body>
        <NoTag>Без категории</NoTag>
      </Body>
    )
  } else {
    return (
      <Body>
        {tag.map(({ title }, i) => (
          <Tag main={!i} key={title}>
            {title}
          </Tag>
        ))}
      </Body>
    )
  }
}
