import React, { useState } from 'react'
import { Paper, Box } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { TagGroup } from './TagGroup'
import TagTableHeader from './TagTableHeader'
import TransactionsDrawer from 'components/TransactionsDrawer'
import { endOfMonth } from 'date-fns'
import sendEvent from 'helpers/sendEvent'
import { getTagsTree } from 'store/localData/tags'
import GoalPopover from './GoalPopover'
import { useCallback } from 'react'
import BudgetPopover from './BudgetPopover'
import { setTagOrder } from 'store/localData/hiddenData/tagOrder'
import { useMonth } from 'scenes/Budgets/useMonth'

const metrics = ['available', 'budgeted', 'outcome']

export function TagTable({ openDetails, onOpenMonthDrawer, ...rest }) {
  const dispatch = useDispatch()
  const tagsTree = useSelector(getTagsTree)
  const [month] = useMonth()
  const [selected, setSelected] = useState()
  const [metricIndex, setMetricIndex] = useState(0)
  const [goalPopoverData, setGoalPopoverData] = useState({})
  const [budgetPopoverData, setBudgetPopoverData] = useState({})

  const onSelect = useCallback(
    id => {
      sendEvent('Budgets: see transactions')
      const parent = tagsTree.find(tag => tag.id === id)
      if (parent) setSelected([id, ...parent.children.map(tag => tag.id)])
      else setSelected([id])
    },
    [tagsTree]
  )

  const moveUp = useCallback(
    id => {
      let parents = tagsTree.map(tag => tag.id)

      let oldIndex = tagsTree.findIndex(tag => tag.id === id)
      if (oldIndex === -1 || oldIndex === 0) return
      const newIndex = oldIndex - 1
      parents.splice(newIndex, 0, parents.splice(oldIndex, 1)[0])

      let flatList = []
      parents.forEach(id => flatList.push(id))
      dispatch(setTagOrder(flatList))
    },
    [tagsTree, dispatch]
  )

  const openBudgetPopover = useCallback(
    (id, anchor) => setBudgetPopoverData({ id, anchor }),
    []
  )
  const openGoalPopover = useCallback(
    (id, anchor) => setGoalPopoverData({ id, anchor }),
    []
  )

  const tagIds = tagsTree.map(tag => tag.id)

  const toggleMetric = useCallback(
    () => setMetricIndex((metricIndex + 1) % 3),
    [metricIndex]
  )

  const filterConditions = {
    type: 'outcome',
    dateFrom: month,
    dateTo: endOfMonth(month),
    tags: selected,
  }

  return (
    <>
      <Box position="relative" py={1} {...rest} clone>
        <Paper>
          <TagTableHeader
            metric={metrics[metricIndex]}
            onToggleMetric={toggleMetric}
            title={'Расходы'}
            onOpenMonthDrawer={onOpenMonthDrawer}
          />
          {tagIds.map(id => (
            <TagGroup
              key={id}
              id={id}
              metric={metrics[metricIndex]}
              date={month}
              openTransactionsPopover={onSelect}
              openBudgetPopover={openBudgetPopover}
              openGoalPopover={openGoalPopover}
              openDetails={openDetails}
              onClick={() => moveUp(id)}
            />
          ))}
        </Paper>
      </Box>

      <TransactionsDrawer
        filterConditions={filterConditions}
        open={!!selected}
        onClose={() => setSelected(undefined)}
      />

      <BudgetPopover
        key={budgetPopoverData.id}
        id={budgetPopoverData.id}
        anchorEl={budgetPopoverData.anchor}
        open={!!budgetPopoverData.anchor}
        month={month}
        onClose={() => setBudgetPopoverData({})}
        style={{ transform: 'translate(-14px, -16px)' }}
      />

      <GoalPopover
        key={goalPopoverData.id}
        id={goalPopoverData.id}
        anchorEl={goalPopoverData.anchor}
        open={!!goalPopoverData.anchor}
        onClose={() => setGoalPopoverData({})}
      />
    </>
  )
}
