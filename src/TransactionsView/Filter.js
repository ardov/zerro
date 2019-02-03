import React, { Component } from 'react'
import { connect } from 'react-redux'
import FilterTags from '../components/FilterTags'
import TagSelect from './TagSelect'
import { setCondition, setTags } from '../store/actions/filter'
import { Checkbox, Input } from 'antd'
import { getFilterConditions } from '../store/selectors'

const Search = Input.Search
class TransactionList extends Component {
  state = {}

  render() {
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
const mapStateToProps = state => ({
  conditions: getFilterConditions(state)()
})

const mapDispatchToProps = dispatch => ({
  setCondition: condition => dispatch(setCondition(condition)),
  setTags: tags => dispatch(setTags(tags))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TransactionList)
