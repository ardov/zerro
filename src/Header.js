import React, { Component } from 'react'
import styled from 'styled-components'
import { StoreContext } from './store/'
import { Link } from 'react-router-dom'
import { Button } from 'antd'

import { updateData } from './store/actions'

const Main = styled.header`
  height: 48px;
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
  /* line-height: 48px; */
  padding: 0;
  margin: 0;
`

const Buttons = styled.div`
  justify-self: flex-end;
`

const NavLink = styled(Link)`
  margin-left: 16px;
`
const StyledButton = styled(Button)`
  margin-left: 16px;
`

export default class TransactionList extends Component {
  static contextType = StoreContext

  render() {
    return (
      <Main>
        <Name>ZenMoney+</Name>
        <div>
          <NavLink to="/">Транзакции</NavLink>
          <NavLink to="/tags">Категории</NavLink>
        </div>
        <Buttons>
          <StyledButton onClick={() => console.log(this.context.data)}>
            Log data
          </StyledButton>

          <StyledButton
            icon="reload"
            onClick={() => {
              this.context.dispatch(updateData())
            }}
          >
            Update Data
          </StyledButton>
        </Buttons>
      </Main>
    )
  }
}
