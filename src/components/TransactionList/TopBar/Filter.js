import React from 'react'
import { connect } from 'react-redux'
import {
  setCondition,
  setTags,
  getFilterConditions,
} from 'store/filterConditions'
import {
  getSelectedIds,
  uncheckAllTransactions,
} from 'store/selectedTransactions'
import {
  setMainTagToTransactions,
  deleteTransactions,
} from 'store/data/transactions'
import Paper from '@material-ui/core/Paper'
import InputBase from '@material-ui/core/InputBase'
import IconButton from '@material-ui/core/IconButton'
import FilterListIcon from '@material-ui/icons/FilterList'
import Tooltip from '@material-ui/core/Tooltip'
import Box from '@material-ui/core/Box'
import Actions from './Actions.js'

import FilterDrawer from './FilterDrawer.js'

function Filter({
  setCondition,
  conditions = {},
  setTags,
  setTag,
  selectedIds,
  uncheckAll,
  deleteTransactions,
  ...rest
}) {
  const [isDrawerVisible, setDrawerVisible] = React.useState(false)
  const toggleDrawer = () => setDrawerVisible(!isDrawerVisible)

  return (
    <Box display="flex" alignItems="center" pl={2} pr={1} {...rest} clone>
      <Paper elevation={4}>
        <Box flexGrow={1} clone>
          {selectedIds.length ? (
            <Actions
              {...{
                selectedIds,
                setTags,
                uncheckAll,
                onSetTag: tagId => setTag(selectedIds, tagId),
                onDelete: () => deleteTransactions(selectedIds),
              }}
            />
          ) : (
            <InputBase
              value={conditions.search || ''}
              placeholder="Поиск по комментариям"
              onChange={e => setCondition({ search: e.target.value })}
            />
          )}
        </Box>

        <Tooltip title="Расширенные фильтры">
          <IconButton onClick={toggleDrawer} children={<FilterListIcon />} />
        </Tooltip>

        <FilterDrawer
          onClose={toggleDrawer}
          open={isDrawerVisible}
          {...{ conditions, setCondition, setTags }}
        />
      </Paper>
    </Box>
  )
}

const mapStateToProps = state => ({
  conditions: getFilterConditions(state),
  // For BulkActions
  selectedIds: getSelectedIds(state),
})

const mapDispatchToProps = dispatch => ({
  setCondition: condition => dispatch(setCondition(condition)),
  setTags: tags => dispatch(setTags(tags)),
  // For BulkActions
  setTag: (ids, tagId) => dispatch(setMainTagToTransactions(ids, tagId)),
  deleteTransactions: ids => {
    dispatch(deleteTransactions(ids))
    dispatch(uncheckAllTransactions())
  },
  uncheckAll: () => dispatch(uncheckAllTransactions()),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Filter)
