import React, { useState, useContext } from 'react'
import { Paper, Box } from '@material-ui/core'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import { useSelector } from 'react-redux'
import { TagGroup } from './TagGroup'
import TagTableHeader from './TagTableHeader'
import TransactionsDrawer from 'components/TransactionsDrawer'
import { endOfMonth } from 'date-fns'
import { sendEvent } from 'helpers/tracking'
import { getTagsTree } from 'store/localData/tags'
import GoalPopover from './GoalPopover'
import { useCallback } from 'react'
import BudgetPopover from './BudgetPopover'
import { useMonth } from 'scenes/Budgets/useMonth'
import { DragModeContext } from '../DnDContext'

const metrics = ['available', 'budgeted', 'outcome']

export function TagTable({ openDetails, onOpenMonthDrawer, ...rest }) {
  const tagsTree = useSelector(getTagsTree)
  const [month] = useMonth()
  const [selected, setSelected] = useState()
  const [metricIndex, setMetricIndex] = useState(0)
  const [goalPopoverData, setGoalPopoverData] = useState({})
  const [budgetPopoverData, setBudgetPopoverData] = useState({})
  const { dragMode } = useContext(DragModeContext)

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
            onOpenMonthDrawer={onOpenMonthDrawer}
          />
          {dragMode === 'REORDER' ? (
            <Droppable droppableId="tags" type="REORDER">
              {provided => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {tagsTree.map((tag, index) => (
                    <Draggable
                      key={tag.id}
                      draggableId={tag.id || 'null'}
                      index={index}
                    >
                      {provided => (
                        <TagGroup
                          id={tag.id}
                          children={tag.children}
                          metric={metrics[metricIndex]}
                          openTransactionsPopover={onSelect}
                          openBudgetPopover={openBudgetPopover}
                          openGoalPopover={openGoalPopover}
                          openDetails={openDetails}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        />
                      )}
                    </Draggable>
                  ))}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ) : (
            tagsTree.map(tag => (
              <TagGroup
                key={tag.id}
                id={tag.id}
                children={tag.children}
                metric={metrics[metricIndex]}
                openTransactionsPopover={onSelect}
                openBudgetPopover={openBudgetPopover}
                openGoalPopover={openGoalPopover}
                openDetails={openDetails}
              />
            ))
          )}
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
        style={{ transform: 'translate(-10px, -12px)' }}
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
