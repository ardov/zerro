import React, { useState } from 'react'
import { Paper, Box } from '@material-ui/core'
import { useSelector } from 'react-redux'
import TagGroup from './TagGroup'
import TagTableHeader from './TagTableHeader'
import TransactionsDrawer from 'components/TransactionsDrawer'
import { endOfMonth } from 'date-fns'
import sendEvent from 'helpers/sendEvent'
import { getTagsTree } from 'store/localData/tags'
import GoalPopover from './GoalPopover'
import { useCallback } from 'react'
import BudgetPopover from './BudgetPopover'

const metrics = ['available', 'budgeted', 'outcome']

export function TagTable({ date, openDetails, required = false, ...rest }) {
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

  const openBudgetPopover = useCallback(
    (id, anchor) => setBudgetPopoverData({ id, anchor }),
    []
  )
  const openGoalPopover = useCallback(
    (id, anchor) => setGoalPopoverData({ id, anchor }),
    []
  )

  const tagIds = tagsTree
    .filter(tag => !!tag.required === !!required)
    .map(tag => tag.id)

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
            title={required ? 'Обязательные расходы' : 'Необязательные расходы'}
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
