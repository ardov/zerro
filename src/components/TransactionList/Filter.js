import React from 'react'
import { connect } from 'react-redux'
import {
  setCondition,
  setTags,
  getFilterConditions,
} from 'store/filterConditions'
import { Input, Icon, Tooltip } from 'antd'
import FilterDrawer from './FilterDrawer.js'

function Filter({ setCondition, conditions = {}, setTags, ...rest }) {
  const [isDrawerVisible, setDrawerVisible] = React.useState(false)
  const toggleDrawer = () => setDrawerVisible(!isDrawerVisible)
  return (
    <div {...rest}>
      <Input
        value={conditions.search}
        suffix={
          <Tooltip title="Расширенные фильтры">
            <Icon
              type="filter"
              style={{ color: 'var(--color-accent)', cursor: 'pointer' }}
              onClick={toggleDrawer}
            />
          </Tooltip>
        }
        placeholder="Поиск по комментариям"
        onChange={e => setCondition({ search: e.target.value })}
      />
      <FilterDrawer
        onClose={toggleDrawer}
        open={isDrawerVisible}
        {...{ conditions, setCondition, setTags }}
      />
    </div>
  )
}

const mapStateToProps = state => ({
  conditions: getFilterConditions(state),
})

const mapDispatchToProps = dispatch => ({
  setCondition: condition => dispatch(setCondition(condition)),
  setTags: tags => dispatch(setTags(tags)),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Filter)
