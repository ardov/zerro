import React from 'react'
import styled from 'styled-components'

import Transaction from './Transaction'

const GroupContainer = styled.div`
  padding: 0 16px;
`
const Group = styled.div`
  max-width: 560px;
  margin: 0 auto;
  position: relative;
`
const Title = styled.h3`
  margin: 0;
  padding: 8px 0;
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: #fff;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.56);
`

export default class TransactionGroup extends React.PureComponent {
  render() {
    return (
      <GroupContainer style={this.props.style}>
        <Group>
          <Title>{this.props.name}</Title>
          <div>
            {this.props.transactions.map(id => (
              <Transaction key={id.id} id={id.id} />
            ))}
          </div>
        </Group>
      </GroupContainer>
    )
  }
}
