import React, { Component } from 'react'
import styled from 'styled-components'
import { StoreContext } from './Store/'
import { Link } from 'react-router-dom'

const Main = styled.header`
  padding: 0 40px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`

const Name = styled.h1`
  font-size: 20px;
  font-weight: 400;
  line-height: 40px;
  padding: 0;
  margin: 0;
`

const Buttons = styled.div`
  justify-self: flex-end;
`

const MenuButton = styled.button`
  margin-left: 16px;
`

export default class TransactionList extends Component {
  static contextType = StoreContext

  render() {
    return (
      <Main>
        <Name>ZenMoney+</Name>
        <Link to="/">Транзакции</Link>
        <Link to="/tags">Категории</Link>
        <Buttons>
          <MenuButton onClick={() => console.log(this.context.data)}>
            Log data
          </MenuButton>
          <MenuButton
            onClick={() => console.log(this.context.actions.updateData())}
          >
            Update Data
          </MenuButton>
        </Buttons>
      </Main>
    )
  }
}
