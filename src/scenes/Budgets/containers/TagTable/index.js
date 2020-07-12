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

const metrics = ['available', 'budgeted', 'outcome']

export function TagTable({ date, openDetails, ...rest }) {
  const dispatch = useDispatch()
  const tagsTree = useSelector(getTagsTree)
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
      if (!parents.find(tagId => tagId === id)) return

      let oldIndex = parents.findIndex(tagId => tagId === id)
      if (oldIndex === 0) return
      const newIndex = oldIndex - 1
      parents.splice(newIndex, 0, parents.splice(oldIndex, 1)[0])

      let flatList = []
      parents.forEach(id => {
        flatList.push(id)

        // if (tag.children) {
        //   tag.children.forEach(tag => {
        //     flatList.push(tag.id)
        //   })
        // }
      })
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

  const toggleMetric = () => setMetricIndex((metricIndex + 1) % 3)

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
          <TagTableHeader
            metric={metrics[metricIndex]}
            onToggleMetric={toggleMetric}
            position="sticky"
            top={0}
            zIndex={2}
            bgcolor="background.paper"
            title={'Расходы'}
          />
          {tagIds.map(id => (
            <TagGroup
              key={id}
              id={id}
              metric={metrics[metricIndex]}
              date={date}
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
        month={date}
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
