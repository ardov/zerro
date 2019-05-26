import React, { Component } from 'react'
import styled from 'styled-components'

import Header from '../containers/Header'
import TransactionList from '../containers/TransactionList'
import Filter from '../containers/Filter'
import DetailsPanel from '../containers/DetailsPanel'

const Body = styled.div`
  display: flex;
  flex-direction: row;
`
const Menu = styled.div`
  width: 280px;
  padding: 40px;
  flex-shrink: 0;
  /* background: rgba(0, 0, 0, 0.06); */
  border-right: 1px solid rgba(0, 0, 0, 0.1);
`
const Content = styled.div`
  flex-grow: 1;
  padding: 0;
  min-width: 0;
`

export default class TransactionsView extends Component {
  render() {
    return (
      <React.Fragment>
        <Header />
        <Body>
          <Menu>
            <Filter />
          </Menu>
          <Content>
            <TransactionList />
          </Content>
          <DetailsPanel />
        </Body>
      </React.Fragment>
    )
  }
}
