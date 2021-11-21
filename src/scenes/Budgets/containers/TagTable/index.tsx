import React, { useState, useContext, FC } from 'react'
import { BoxProps, Paper } from '@mui/material'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import { useSelector } from 'react-redux'
import { TagGroup } from './TagGroup'
import { TagTableHeader } from './TagTableHeader'
import { TagTableFooter } from './TagTableFooter'
import { TransactionsDrawer as TrDrawer } from 'components/TransactionsDrawer'
import { endOfMonth } from 'date-fns'
import { sendEvent } from 'helpers/tracking'
import { GoalPopover } from './GoalPopover'
import { useCallback } from 'react'
import { BudgetPopover } from './BudgetPopover'
import { useMonth } from 'scenes/Budgets/pathHooks'
import { DragModeContext } from '../DnDContext'
import { getPopulatedTags, getTagsTree } from 'store/data/tags'
import { getTagAccMap } from 'store/data/hiddenData/accTagMap'
import { getInBudgetAccounts } from 'store/data/accounts'
import { FilterConditions } from 'store/data/transactions/filtering'
import { getAmountsById } from 'scenes/Budgets/selectors'

export type MetricType = 'outcome' | 'available' | 'budgeted'

const metrics: MetricType[] = ['available', 'budgeted', 'outcome']

type PopoverData = { id?: string; anchor?: Element }

type TagTableProps = {
  openDetails: (id: string) => void
  onOpenMonthDrawer: () => void
  sx?: BoxProps['sx']
  className: string
}

export const TagTable: FC<TagTableProps> = props => {
  const { openDetails, onOpenMonthDrawer, sx, className } = props
  const tagsTree = useSelector(getTagsTree)
  const [month] = useMonth()
  const amounts = useSelector(getAmountsById)?.[month]
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({})
  const [selected, setSelected] = useState<string>()
  const [metricIndex, setMetricIndex] = useState(0)
  const [goalPopoverData, setGoalPopoverData] = useState<PopoverData>({})
  const [budgetPopoverData, setBudgetPopoverData] = useState<PopoverData>({})
  const { dragMode } = useContext(DragModeContext)

  const setTagExpanded = useCallback((id: string, state: boolean) => {
    setExpanded(obj => ({ ...obj, [id]: state }))
  }, [])
  const setAllExpanded = useCallback(
    (state: boolean) => {
      const expanded = Object.fromEntries(tagsTree.map(t => [t.id, state]))
      setExpanded(expanded)
    },
    [tagsTree]
  )

  const onSelect = useCallback((id: string) => {
    sendEvent('Budgets: see transactions')
    setSelected(id)
  }, [])
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

  const tagGroupProps = tagsTree.map(tag => {
    const { id } = tag
    const {
      totalAvailable,
      totalOutcome,
      totalBudgeted,
      childrenAvailable,
    } = amounts[id]

    const isVisible = Boolean(
      tag.showOutcome ||
        totalBudgeted ||
        totalOutcome ||
        totalAvailable ||
        dragMode === 'REORDER'
    )

    const isExpanded =
      expanded[id] === undefined ? childrenAvailable > 0 : expanded[id]

    return {
      id,
      tag,
      isVisible,
      isExpanded,
      tagChildren: tag.children,
      metric: metrics[metricIndex],
      onExpand: setTagExpanded,
      onExpandAll: setAllExpanded,
      openTransactionsPopover: onSelect,
      openBudgetPopover: openBudgetPopover,
      openGoalPopover: openGoalPopover,
      openDetails: openDetails,
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
                {tagGroupProps.map((props, index) => (
                  <Draggable
                    key={props.id}
                    draggableId={props.id || 'null'}
                    index={index}
                  >
                    {provided => (
                      <TagGroup
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        {...props}
                      />
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ) : (
          tagGroupProps.map(props => <TagGroup key={props.id} {...props} />)
        )}

        <TagTableFooter metric={metrics[metricIndex]} />
      </Paper>

      <TransactionsDrawer
        id={selected}
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

type TransactionsDrawerProps = {
  id?: string | null
  onClose: () => void
}

const TransactionsDrawer: FC<TransactionsDrawerProps> = props => {
  const { id, onClose } = props
  const [month] = useMonth()
  const accountsInBudget = useSelector(getInBudgetAccounts).map(a => a.id)
  const tagAccMap = useSelector(getTagAccMap)
  const tagsById = useSelector(getPopulatedTags)

  if (!id) return <TrDrawer open={false} onClose={onClose} />

  const tag = tagsById[id]
  const tagIds = [tag.id, ...tag.children]

  let prefilter: FilterConditions[] = []
  prefilter.push({
    type: 'outcome',
    dateFrom: month,
    dateTo: endOfMonth(month),
    accountsFrom: accountsInBudget,
    mainTags: tagIds,
  })
  tagIds.forEach(id => {
    if (tagAccMap[id]) {
      prefilter.push({
        type: 'transfer',
        dateFrom: month,
        dateTo: endOfMonth(month),
        accountsFrom: accountsInBudget,
        accountsTo: tagAccMap[id],
      })
      prefilter.push({
        type: 'transfer',
        dateFrom: month,
        dateTo: endOfMonth(month),
        accountsFrom: tagAccMap[id],
        accountsTo: accountsInBudget,
      })
    }
  })

  return <TrDrawer prefilter={prefilter} open={!!id} onClose={onClose} />
}
