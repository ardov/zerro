import React from 'react'
import styled from 'styled-components'
import Transaction from './Transaction'

const GroupContainer = styled.div`
  padding: 0 16px;
`
const Group = styled.div`
  position: relative;
  max-width: 560px;
  margin: 0 auto;
`
const Title = styled.h3`
  position: sticky;
  top: 0;
  z-index: 2;
  margin: 0;
  padding: 16px 0 8px;
  color: var(--text-secondary);
  font-weight: 400;
  background-color: #fff;
`

export default class TransactionGroup extends React.PureComponent {
  render() {
    const { style, name, transactions, topOffset = 0 } = this.props
    return (
      <GroupContainer style={style}>
        <Group>
          <Title style={{ top: topOffset }}>{name}</Title>
          <div>
            {transactions.map(id => (
              <Transaction key={id.id} id={id.id} />
            ))}
          </div>
        </Group>
      </GroupContainer>
    )
  }
}
