import React, { Component } from 'react'
import styled from 'styled-components'

import { StoreContext } from './Store/'

export default class TransactionList extends Component {
  static contextType = StoreContext
  updateFilter = this.context.actions.updateFilter

  state = {}

  render() {
    const conditions = this.context.data.filterConditions
    return (
      <div>
        <input
          onChange={e => {
            this.updateFilter({ search: e.target.value })
          }}
          value={conditions.search || ''}
        />
        <label>
          <input
            type="checkbox"
            checked={conditions.showDeleted}
            onChange={e => {
              this.updateFilter({ showDeleted: e.target.checked })
            }}
          />
          Show deleted
        </label>
      </div>
    )
  }
}
