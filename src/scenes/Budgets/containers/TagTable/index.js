import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'

import { Paper, Box } from '@material-ui/core'
import { setOutcomeBudget } from '../../thunks'
import { getAmountsByTag } from '../../selectors/getAmountsByTag'
import { getUserCurrencyCode } from 'store/serverData'
import Row from './Row'
import TagTableHeader from './TagTableHeader'
import TransactionsDrawer from 'components/TransactionsDrawer'
import { endOfMonth } from 'date-fns'
import sendEvent from 'helpers/sendEvent'
import { getGoals } from 'store/localData/hiddenData'
import { getTagsTree } from 'store/localData/tags'
import GoalPopover from './GoalPopover'

const metrics = ['available', 'budgeted', 'outcome']

function TagTable({
  tags,
  tagsTree,
  goals,
  currency,
  date,
  updateBudget,
  required = false,
  ...rest
}) {
  const [selected, setSelected] = useState()
  const [metricIndex, setMetricIndex] = useState(0)
  const [goalPopoverData, setGoalPopoverData] = useState({})

  const selectTag = id => {
    const parent = tagsTree.find(tag => tag.id === id)
    if (parent) setSelected([id, ...parent.children.map(tag => tag.id)])
    else setSelected([id])
  }

  const filtered = tags
    .filter(tag => tag.showOutcome || tag.totalOutcome || tag.totalAvailable)
    .filter(tag => !!tag.required === !!required)
    .sort((a, b) => a.name.localeCompare(b.name))

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

  return (
    <>
      <Box position="relative" py={1} clone>
        <Paper>
          <TransactionsDrawer
            filterConditions={filterConditions}
            open={!!selected}
            onClose={() => setSelected(undefined)}
          />
          <TagTableHeader
            metric={metrics[metricIndex]}
            onToggleMetric={toggleMetric}
            position="sticky"
            top={0}
            zIndex={2}
            bgcolor="background.paper"
            title={required ? 'Обязательные расходы' : 'Необязательные расходы'}
          />
          {filtered.map(tag => (
            <Row
              key={tag.id}
              goals={goals}
              metric={metrics[metricIndex]}
              {...tag}
              setBudget={updateBudget}
              onSelect={id => selectTag(id)}
              date={date}
              openGoalPopover={(id, anchor) =>
                setGoalPopoverData({ id, anchor })
              }
            ></Row>
          ))}
        </Paper>
      </Box>

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
  tags: getAmountsByTag(state)[index].tags,
  tagsTree: getTagsTree(state),
  goals: getGoals(state),
  currency: getUserCurrencyCode(state),
})

const mapDispatchToProps = dispatch => ({
  updateBudget: (outcome, month, tagId) =>
    dispatch(setOutcomeBudget(outcome, month, tagId)),
})

export default connect(mapStateToProps, mapDispatchToProps)(TagTable)
