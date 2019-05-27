import React, { Component } from 'react'
import styled from 'styled-components'

import Header from '../containers/Header'
import TransactionList from '../containers/TransactionList'
import Filter from '../containers/Filter'
import DetailsPanel from '../containers/DetailsPanel'

const Body = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100vh - 48px);
  overflow: auto;
`
const Menu = styled.div`
  width: 280px;
  padding: 40px;
  flex-shrink: 0;
  /* background: rgba(0, 0, 0, 0.06); */
  border-right: 1px solid rgba(0, 0, 0, 0.1);
`
const Content = styled.div`
  height: 100%;
  flex-grow: 1;
  min-width: 0;
`
const SidePanel = styled.div`
  width: 480px;
  overflow: auto;
  /* position: sticky;
  top: 0;
  align-self: flex-start;
  flex-shrink: 0; */
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
          <SidePanel>
            <DetailsPanel />
          </SidePanel>
        </Body>
      </React.Fragment>
    )
  }
}
