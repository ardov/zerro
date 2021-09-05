import React, { useState, useContext, FC } from 'react'
import { BoxProps, Paper } from '@mui/material'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import { useSelector } from 'react-redux'
import { TagGroup } from './TagGroup'
import { TagTableHeader } from './TagTableHeader'
import { TagTableFooter } from './TagTableFooter'
import { TransactionsDrawer } from 'components/TransactionsDrawer'
import { endOfMonth } from 'date-fns'
import { sendEvent } from 'helpers/tracking'
import { getTagsTree } from 'store/localData/tags'
import { GoalPopover } from './GoalPopover'
import { useCallback } from 'react'
import { BudgetPopover } from './BudgetPopover'
import { useMonth } from 'scenes/Budgets/pathHooks'
import { DragModeContext } from '../DnDContext'
import { getTagAccMap } from 'store/localData/hiddenData/accTagMap'
import { getInBudgetAccounts } from 'store/localData/accounts'
import { FilterConditions } from 'store/localData/transactions/filtering'

export type MetricType = 'outcome' | 'available' | 'budgeted'

const metrics: MetricType[] = ['available', 'budgeted', 'outcome']

type TagTableProps = {
  openDetails: (id: string) => void
  onOpenMonthDrawer: () => void
  sx?: BoxProps['sx']
  className: string
}

export const TagTable: FC<TagTableProps> = ({
  openDetails,
  onOpenMonthDrawer,
  sx,
  className,
}) => {
  const tagsTree = useSelector(getTagsTree)
  const tagAccMap = useSelector(getTagAccMap)
  const accountsInBudget = useSelector(state =>
    getInBudgetAccounts(state).map(acc => acc.id)
  )
  const [month] = useMonth()
  const [selected, setSelected] = useState<string[]>()
  const [metricIndex, setMetricIndex] = useState(0)
  const [goalPopoverData, setGoalPopoverData] = useState<{
    id?: string
    anchor?: Element
  }>({})
  const [budgetPopoverData, setBudgetPopoverData] = useState<{
    id?: string
    anchor?: Element
  }>({})
  const { dragMode } = useContext(DragModeContext)

  const onSelect = useCallback(
    (id: string) => {
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

  let prefilter: FilterConditions[] = []
  prefilter.push({
    type: 'outcome',
    dateFrom: month,
    dateTo: endOfMonth(month),
    accountsFrom: accountsInBudget,
    tags: selected,
  })
  selected?.forEach(tagId => {
    if (tagAccMap[tagId]) {
      prefilter.push({
        type: 'transfer',
        dateFrom: month,
        dateTo: endOfMonth(month),
        accountsFrom: accountsInBudget,
        accountsTo: tagAccMap[tagId],
      })
      prefilter.push({
        type: 'transfer',
        dateFrom: month,
        dateTo: endOfMonth(month),
        accountsFrom: tagAccMap[tagId],
        accountsTo: accountsInBudget,
      })
    }
  })

  return (
    <>
      <Paper sx={{ position: 'relative', py: 1, ...sx }} className={className}>
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
                        tagChildren={tag.children}
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
              tagChildren={tag.children}
              metric={metrics[metricIndex]}
              openTransactionsPopover={onSelect}
              openBudgetPopover={openBudgetPopover}
              openGoalPopover={openGoalPopover}
              openDetails={openDetails}
            />
          ))
        )}

        <TagTableFooter metric={metrics[metricIndex]} />
      </Paper>

      <TransactionsDrawer
        prefilter={prefilter}
        open={!!selected}
        onClose={() => setSelected(undefined)}
      />
      <BudgetPopover
        key={budgetPopoverData.id}
        id={budgetPopoverData.id || ''}
        anchorEl={budgetPopoverData.anchor}
        open={!!budgetPopoverData.anchor}
        month={month}
        onClose={() => setBudgetPopoverData({})}
        style={{ transform: 'translate(-10px, -12px)' }}
      />
      <GoalPopover
        key={goalPopoverData.id}
        id={goalPopoverData.id || ''}
        anchorEl={goalPopoverData.anchor}
        open={!!goalPopoverData.anchor}
        onClose={() => setGoalPopoverData({})}
      />
    </>
  )
}
