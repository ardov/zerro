import React, { Component } from 'react'
import styled from 'styled-components'

import { StoreContext } from '../Store/'
import { Checkbox, Input } from 'antd'

const Search = Input.Search
export default class TransactionList extends Component {
  static contextType = StoreContext
  updateFilter = this.context.actions.updateFilter

  state = {}

  render() {
    const conditions = this.context.data.filterConditions
    return (
      <div>
        <Search
          value={conditions.search}
          placeholder="Поиск по комментариям"
          onChange={e => {
            this.updateFilter({ search: e.target.value })
          }}
        />

        <Checkbox
          checked={conditions.showDeleted}
          onChange={e => {
            this.updateFilter({ showDeleted: e.target.checked })
          }}
        >
          Показывать удалённые
        </Checkbox>
      </div>
    )
  }
}
