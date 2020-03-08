import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'

import { Paper, Box } from '@material-ui/core'
import { setOutcomeBudget } from '../../thunks'
import TagGroup from './TagGroup'
import TagTableHeader from './TagTableHeader'
import TransactionsDrawer from 'components/TransactionsDrawer'
import { endOfMonth } from 'date-fns'
import sendEvent from 'helpers/sendEvent'
import { getTagsTree } from 'store/localData/tags'
import GoalPopover from './GoalPopover'
import { useCallback } from 'react'

const metrics = ['available', 'budgeted', 'outcome']

function TagTable({ tagsTree, date, updateBudget, required = false, ...rest }) {
  const [selected, setSelected] = useState()
  // const [showAll, setShowAll] = useState(false)
  const [metricIndex, setMetricIndex] = useState(0)
  const [goalPopoverData, setGoalPopoverData] = useState({})

  const onSelect = useCallback(
    id => {
      const parent = tagsTree.find(tag => tag.id === id)
      if (parent) setSelected([id, ...parent.children.map(tag => tag.id)])
      else setSelected([id])
    },
    [tagsTree]
  )

  const tagIds = tagsTree
    .filter(tag => !!tag.required === !!required)
    .map(tag => tag.id)

  useEffect(() => {
    if (selected) sendEvent('Budgets: see transactions')
  }, [selected])

  const toggleMetric = () =>
    setMetricIndex(metricIndex === 2 ? 0 : metricIndex + 1) // metricIndex + 1 % 3

  const filterConditions = {
    type: 'outcome',
    dateFrom: date,
    dateTo: endOfMonth(date),
    tags: selected,
  }

  const openGoalPopover = useCallback(
    (id, anchor) => setGoalPopoverData({ id, anchor }),
    []
  )

  return (
    <>
      <Box position="relative" py={1} clone>
        <Paper>
          <TagTableHeader
            metric={metrics[metricIndex]}
            onToggleMetric={toggleMetric}
            position="sticky"
            top={0}
            zIndex={2}
            bgcolor="background.paper"
            title={required ? 'Обязательные расходы' : 'Необязательные расходы'}
          />
          {tagIds.map(id => (
            <TagGroup
              key={id}
              id={id}
              metric={metrics[metricIndex]}
              setBudget={updateBudget}
              onSelect={onSelect}
              date={date}
              openGoalPopover={openGoalPopover}
            ></TagGroup>
          ))}
        </Paper>
      </Box>

      <TransactionsDrawer
        filterConditions={filterConditions}
        open={!!selected}
        onClose={() => setSelected(undefined)}
      />

      <GoalPopover
        tag={goalPopoverData.id}
        anchorEl={goalPopoverData.anchor}
        open={!!goalPopoverData.anchor}
        onClose={() => setGoalPopoverData({})}
      />
    </>
  )
}

const mapStateToProps = (state, { index }) => ({
  tagsTree: getTagsTree(state),
})

const mapDispatchToProps = dispatch => ({
  updateBudget: (outcome, month, tagId) =>
    dispatch(setOutcomeBudget(outcome, month, tagId)),
})

export default connect(mapStateToProps, mapDispatchToProps)(TagTable)
