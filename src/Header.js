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

const BarChart = ({ amounts = [], color = '#000' }) => {
  const Body = styled.div`
    display: flex;
    flex-direction: row;
    height: 40px;
  `
  const Month = styled.div`
    flex-grow: 1;
    display: flex;
    padding: 4px;
    height: 40px;
  `
  const Bar = styled.div`
    height: ${props => props.percent}%;
    background-color: #000;
    min-height: 1px;
    min-width: 8px;
    align-self: flex-end;
    border-radius: 2px;
  `

  const max = Math.max(...amounts)

  return (
    <Body>
      {amounts.map(sum => (
        <Month>
          <Bar percent={(sum / max) * 100} />
        </Month>
      ))}
    </Body>
  )
}

export default class TransactionList extends Component {
  static contextType = StoreContext

  render() {
    return (
      <Main>
        <Name>ZenMoney+</Name>
        <Link to="/tags">Категории</Link>
        <Link to="/">Транзакции</Link>
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
