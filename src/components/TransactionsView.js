import React, { Component } from 'react'
import styled from 'styled-components'

import Header from '../containers/Header'
import TransactionList from '../containers/TransactionList'
import Filter from '../containers/Filter'
import DetailsPanel from '../containers/DetailsPanel'
import { Button } from 'antd'

const Body = styled.div`
  display: flex;
  flex-direction: row;
`
const Menu = styled.div`
  width: 280px;
  padding: 40px;
  /* background: rgba(0, 0, 0, 0.06); */
  border-right: 1px solid rgba(0, 0, 0, 0.1);
`
const Content = styled.div`
  flex-grow: 1;
  padding: 0 40px;
  flex-direction: column;
`

export default class TransactionsView extends Component {
  state = {
    limit: 20,
    limitStep: 50
  }
  loadMore = () => {
    this.setState(state => {
      return { limit: state.limit + state.limitStep }
    })
  }

  render() {
    return (
      <div>
        <Header />
        <Body>
          <Menu>
            <Filter />
          </Menu>
          <Content>
            <TransactionList limit={this.state.limit} />
            <Button onClick={this.loadMore}>Load more</Button>
          </Content>
          <DetailsPanel />
        </Body>
      </div>
    )
  }
}
