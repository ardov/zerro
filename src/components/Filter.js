import React, { Component } from 'react'
import FilterTags from './FilterTags'
import TagSelect from '../containers/TagSelect'
import { Checkbox, Input } from 'antd'

const Search = Input.Search
export default class Filter extends Component {
  state = {}

  render() {
    console.log('FILTER RENDER')

    const conditions = this.props.conditions
    return (
      <div>
        <Search
          value={conditions.search}
          placeholder="Поиск по комментариям"
          onChange={e => {
            this.props.setCondition({ search: e.target.value })
          }}
        />

        <Checkbox
          checked={conditions.showDeleted}
          onChange={e => {
            this.props.setCondition({ showDeleted: e.target.checked })
          }}
        >
          Показывать удалённые
        </Checkbox>
        <TagSelect value={conditions.tags} onChange={this.props.setTags} />
        <FilterTags conditions={conditions} />
      </div>
    )
  }
}
