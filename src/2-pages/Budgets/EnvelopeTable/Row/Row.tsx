import type { FC, ReactNode } from 'react'
import React, { useCallback } from 'react'
import clsx from 'clsx'
import { core } from 'zerro-core/redux'

import { useDroppable } from '@dnd-kit/core'
import type { IconButtonProps } from '@mui/material'
import { IconButton } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '6-shared/ui/Tooltip'
import { EmojiFlagsIcon } from '6-shared/ui/Icons'
import { RadialProgress } from '6-shared/ui/RadialProgress'
import type { TFxCode, TISOMonth } from '6-shared/types'

import { useAppSelector } from 'store'

import { DragTypes } from '2-pages/Budgets/DnD'
import { useBudgetPopover } from '../../BudgetPopover'
import { useGoalPopover } from '../../GoalPopover'

import { Metric, useColumns } from '../models/useMetric'
import { TableRow, useIsSmall } from '../shared/shared'
import type { RevealItem } from '../SlideReveal'
import { SlideReveal } from '../SlideReveal'
import { NameCell } from './NameCell'
import { BudgetCell } from './BudgetCell'
import { ActivityCell } from './ActivityCell'
import {
  AvailableCell,
  getAvailableColor,
  getAvailableColorClass,
} from './AvailableCell'

type EnvelopeRowProps = {
  id: core.envelopes.TEnvelopeId
  month: TISOMonth
  isSelf?: boolean
  isDefaultVisible: boolean
  isLastVisibleChild?: boolean
  isExpanded?: boolean
  isReordering: boolean
  openDetails: (id: core.envelopes.TEnvelopeId) => void
  openTransactionsPopover: (id: core.envelopes.TEnvelopeId) => void
}

/** Builds reveal items for metrics not currently shown as columns. */
function useRevealItems(params: {
  id: core.envelopes.TEnvelopeId
  columns: Metric[]
  assigned: number
  activity: number
  available: number
  isChild: boolean
  isSelf?: boolean
  openBudgetPopover: (id: core.envelopes.TEnvelopeId, el: Element) => void
  openTransactionsPopover: (id: core.envelopes.TEnvelopeId) => void
}): RevealItem[] {
  const {
    id,
    columns,
    assigned,
    activity,
    available,
    isChild,
    isSelf,
    openBudgetPopover,
    openTransactionsPopover,
  } = params
  const { t } = useTranslation(['budgets', 'common'])

  type MetricConfig = { metric: Metric; item: RevealItem }

  const allMetrics: MetricConfig[] = [
    {
      metric: Metric.assigned,
      item: {
        key: Metric.assigned,
        label: t('assigned', { ns: 'common' }),
        value: assigned,
        color:
          isSelf || !assigned ? 'text-disabled-foreground' : 'text-foreground',
        onClick: e => openBudgetPopover(id, e.currentTarget),
      },
    },
    {
      metric: Metric.outcome,
      item: {
        key: Metric.outcome,
        label: t('activity', { ns: 'common' }),
        value: activity,
        color: activity ? 'text-foreground' : 'text-disabled-foreground',
        onClick: () => openTransactionsPopover(id),
      },
    },
    {
      metric: Metric.available,
      item: {
        key: Metric.available,
        label: t('available', { ns: 'common' }),
        value: available,
        color: getAvailableColorClass(
          getAvailableColor(available, isChild, !!assigned, isSelf)
        ),
        draggable: { type: DragTypes.amount, id, disabled: !!isSelf },
      },
    },
  ]

  return allMetrics
    .filter(({ metric }) => !columns.includes(metric))
    .map(({ item }) => item)
}

export const Row: FC<EnvelopeRowProps> = props => {
  const {
    id,
    month,
    isSelf,
    isDefaultVisible,
    isLastVisibleChild,
    isExpanded,
    isReordering,
    openTransactionsPopover,
    openDetails,
  } = props
  const openBudgetPopover = useBudgetPopover()
  const openGoalPopover = useGoalPopover()
  const isSmall = useIsSmall()
  const { columns } = useColumns()

  const envelope = useAppSelector(core.envelopes.selectAll)[id]
  const envData = useAppSelector(core.activity.selectEnvelopeMetrics)[month][id]
  const goalInfo = useAppSelector(core.goals.selectAll)[month][id]
  const toDisplay = core.currency.useToDisplay(month)

  const isChild = !!envelope.parent || !!isSelf

  const assigned = toDisplay(
    isSelf ? envData.selfAssigned : envData.totalAssigned
  )
  const activity = toDisplay(
    isSelf ? envData.selfActivity : envData.totalActivity
  )
  const available = toDisplay(
    isSelf ? envData.selfAvailable : envData.totalAvailable
  )
  const hiddenOverspend =
    isSelf || isChild || toDisplay(envData.selfAvailable) >= 0
      ? 0
      : toDisplay(envData.totalAvailable) >= 0
        ? toDisplay(envData.selfAvailable)
        : 0

  const handleNameClick = useCallback(() => openDetails(id), [id, openDetails])
  const handleGoalClick: React.MouseEventHandler<HTMLButtonElement> =
    useCallback(
      e => {
        e.preventDefault()
        e.stopPropagation()
        openGoalPopover(id, e.currentTarget)
      },
      [id, openGoalPopover]
    )

  const revealItems = useRevealItems({
    id,
    columns,
    assigned,
    activity,
    available,
    isChild,
    isSelf,
    openBudgetPopover,
    openTransactionsPopover,
  })

  return (
    <Droppable
      id={id}
      isChild={isChild}
      isLastVisibleChild={!!isLastVisibleChild}
      isExpanded={!!isExpanded}
    >
      <SlideReveal enabled={isSmall} items={revealItems}>
        <TableRow
          className={clsx(
            'relative cursor-pointer transition-colors duration-100 hover:bg-accent active:bg-action-focus',
            'hover:[&_.addGoal]:opacity-100 hover:[&_.addGoal]:transition-opacity hover:[&_.addGoal]:duration-300',
            '[&:not(:hover)_.addGoal]:opacity-0',
            isChild ? '[&>*]:py-1' : '[&>*]:py-2'
          )}
          name={
            <NameCell
              onClick={handleNameClick}
              envelope={envelope}
              isChild={isChild}
              isSelf={isSelf}
              isDefaultVisible={isDefaultVisible}
              isReordering={isReordering}
            />
          }
          assigned={
            <BudgetCell
              isSelf={isSelf}
              value={assigned}
              onBudgetClick={e => openBudgetPopover(id, e.currentTarget)}
            />
          }
          outcome={
            <ActivityCell
              value={activity}
              onClick={() => openTransactionsPopover(id)}
            />
          }
          available={
            <AvailableCell
              hiddenOverspend={hiddenOverspend}
              id={id}
              available={available}
              isChild={isChild}
              assigned={assigned}
              isSelf={isSelf}
            />
          }
          goal={
            !isSelf && (
              <GoalButton
                goal={goalInfo?.goal}
                currency={envelope.currency}
                goalProgress={goalInfo?.progress}
                onClick={handleGoalClick}
              />
            )
          }
        />
      </SlideReveal>
    </Droppable>
  )
}

const Droppable: FC<{
  id: core.envelopes.TEnvelopeId
  isChild: boolean
  isLastVisibleChild: boolean
  isExpanded: boolean
  children: ReactNode
}> = props => {
  const { id, isChild, isLastVisibleChild, isExpanded, children } = props
  const { setNodeRef } = useDroppable({
    id: 'envelope-drop' + id + isChild,
    data: { type: DragTypes.envelope, id, isLastVisibleChild, isExpanded },
  })

  return <div ref={setNodeRef}>{children}</div>
}

type GoalButtonProps = {
  goal: core.goals.TGoal | null
  currency: TFxCode
  goalProgress?: number | null
  onClick: IconButtonProps['onClick']
}

const GoalButton: FC<GoalButtonProps> = props => {
  const { goal, currency, goalProgress, onClick } = props
  const { t } = useTranslation('budgets')

  if (!goal) {
    return (
      <span className={'addGoal'}>
        <Tooltip title={t('addGoal')}>
          <IconButton size="small" onClick={onClick}>
            <EmojiFlagsIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </span>
    )
  }

  return (
    <span>
      <Tooltip title={core.goals.formatGoal(goal, currency)}>
        <IconButton size="small" onClick={onClick}>
          <RadialProgress value={goalProgress || 0} fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </span>
  )
}
