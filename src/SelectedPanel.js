import React from 'react'
import { StoreContext } from './Store/'
import styled, { css } from 'styled-components'

const Body = styled.section`
  border-left: 1px solid #eee;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  padding: 40px;
`

export default class SelectedPanel extends React.Component {
  static contextType = StoreContext
  deleteTransaction = this.context.actions.deleteTransaction
  getElement = this.context.actions.getElement
  id = this.context.data.selectedTransaction

  render() {
    const tr = this.getElement(
      'transaction',
      this.context.data.selectedTransaction
    )
    console.log(tr)
    return (
      <Body>
        {tr && (
          <div>
            Выбранная
            <br />
            {tr.id}
            <br />
            <button
              onClick={e => {
                this.deleteTransaction(tr.id)
              }}
            >
              Delete
            </button>
          </div>
        )}
      </Body>
    )
  }
}
