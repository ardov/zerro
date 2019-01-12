import React, { Component } from 'react'
import FilterTags from '../components/FilterTags'
import { setCondition } from '../store/actions/filter'
// import styled from 'styled-components'

import { StoreContext } from '../store/'
import { Checkbox, Input } from 'antd'

const Search = Input.Search
export default class TransactionList extends Component {
  static contextType = StoreContext

  state = {}

  render() {
    const dispatch = this.context.dispatch
    const conditions = this.context.selectors.getFilterConditions()
    return (
      <div>
        <Search
          value={conditions.search}
          placeholder="Поиск по комментариям"
          onChange={e => {
            dispatch(setCondition({ search: e.target.value }))
          }}
        />

        <Checkbox
          checked={conditions.showDeleted}
          onChange={e => {
            dispatch(setCondition({ showDeleted: e.target.checked }))
          }}
        >
          Показывать удалённые
        </Checkbox>
        <FilterTags conditions={conditions} />
      </div>
    )
  }
}
