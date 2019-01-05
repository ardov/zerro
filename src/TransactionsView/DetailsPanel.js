import React from 'react'
import { StoreContext } from '../Store'
import styled, { css } from 'styled-components'

const Body = styled.section`
  border-left: 1px solid #eee;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  padding: 40px;
`

export default class DetailsPanel extends React.Component {
  static contextType = StoreContext

  render() {
    const { deleteTransaction, getElement } = this.context.actions
    const tr = getElement('transaction', this.context.data.openedTransaction)

    return (
      <Body>
        {tr && (
          <div>
            Выбранная
            <br />
            {tr.id}
            <br />
            <button
              onClick={() => {
                deleteTransaction(tr.id)
              }}
            >
              Delete
            </button>
            <button
              onClick={() => {
                console.log(tr)
              }}
            >
              Log Transaction
            </button>
          </div>
        )}
      </Body>
    )
  }
}
