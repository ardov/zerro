import React from 'react'
import styled from 'styled-components'

import Transaction from '../containers/Transaction'

const Group = styled.section`
  padding-top: 20px;
  position: relative;

  &:first-child {
    padding-top: 0;
  }
`
const Title = styled.h3`
  margin: 0;
  padding: 8px 0;
  position: sticky;
  top: 0;
  background-color: #fff;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.56);
`

export default class TransactionGroup extends React.PureComponent {
  render() {
    console.log('RENDER GROUP', this.props.name, this.props.transactions)

    return (
      <Group>
        <Title>{this.props.name}</Title>
        <div>
          {this.props.transactions.map(id => (
            <Transaction key={id} id={id} />
          ))}
        </div>
      </Group>
    )
  }
}
