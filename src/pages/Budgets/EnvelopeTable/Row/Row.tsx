import React, { FC, useCallback } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { IconButton, IconButtonProps, BoxProps, Box } from '@mui/material'
import { SxProps } from '@mui/system'
import { Tooltip } from '@shared/ui/Tooltip'
import { EmojiFlagsIcon } from '@shared/ui/Icons'
import { RadialProgress } from '@shared/ui/RadialProgress'
import { TEnvelopeId, TISOMonth } from '@shared/types'
import { goalModel, TGoal } from '@entities/goal'
import { DragTypes } from '../../DnDContext'
import { rowStyle, useIsSmall } from '../shared/shared'
import { Metric } from '../models/useMetric'
import { useBudgetPopover } from '@pages/Budgets/BudgetPopover'
import { useGoalPopover } from '@pages/Budgets/GoalPopover'
import { NameCell } from './NameCell'
import { balances } from '@entities/envBalances'
import { envelopeModel } from '@entities/envelope'
import { BudgetCell } from './BudgetCell'
import { ActivityCell } from './ActivityCell'
import { AvailableCell } from './AvailableCell'
import { displayCurrency } from '@entities/currency/displayCurrency'

type EnvelopeRowProps = {
  id: TEnvelopeId
  month: TISOMonth
  metric: Metric
  isSelf?: boolean
  isDefaultVisible: boolean
  isLastVisibleChild?: boolean
  isExpanded?: boolean
  isReordering: boolean
  openDetails: (id: TEnvelopeId) => void
  openTransactionsPopover: (id: TEnvelopeId) => void
}

export const Row: FC<EnvelopeRowProps> = props => {
  const {
    id,
    month,
    metric,
    isSelf,
    isDefaultVisible,
    isLastVisibleChild,
    isExpanded,
    isReordering,
    openTransactionsPopover,
    openDetails,
  } = props
  const isSmall = useIsSmall()
  const openBudgetPopover = useBudgetPopover()
  const openGoalPopover = useGoalPopover()

  const envelope = envelopeModel.useEnvelopes()[id]
  const envData = balances.useEnvData()[month][id]
  const goalInfo = goalModel.useGoals()[month][id]
  const toDisplay = displayCurrency.useToDisplay(month)

  const isChild = !!envelope.parent || !!isSelf

  const budgeted = toDisplay(
    isSelf ? envData.selfBudgeted : envData.totalBudgeted
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
      e => openGoalPopover(id, e.currentTarget),
      [id, openGoalPopover]
    )

  return (
    <Droppable
      id={id}
      isChild={isChild}
      isLastVisibleChild={!!isLastVisibleChild}
      isExpanded={!!isExpanded}
    >
      <RowWrapper isChild={isChild} onClick={handleNameClick}>
        <NameCell
          envelope={envelope}
          isChild={isChild}
          isSelf={isSelf}
          isDefaultVisible={isDefaultVisible}
          isReordering={isReordering}
        />

        {(metric === Metric.budgeted || !isSmall) && (
          <BudgetCell
            isSelf={isSelf}
            value={budgeted}
            onBudgetClick={e => {
              e.stopPropagation()
              openBudgetPopover(id, e.currentTarget)
            }}
          />
        )}

        {(metric === Metric.outcome || !isSmall) && (
          <ActivityCell
            value={activity}
            onClick={e => {
              e.stopPropagation()
              openTransactionsPopover(id)
            }}
          />
        )}

        {(metric === Metric.available || !isSmall) && (
          <AvailableCell
            hiddenOverspend={hiddenOverspend}
            id={id}
            available={available}
            isChild={isChild}
            budgeted={budgeted}
            isSelf={isSelf}
          />
        )}

        {!isSelf && (
          <GoalButton
            goal={goalInfo?.goal}
            goalProgress={goalInfo?.progress}
            onClick={handleGoalClick}
          />
        )}
      </RowWrapper>
    </Droppable>
  )
}

const Droppable: FC<{
  id: TEnvelopeId
  isChild: boolean
  isLastVisibleChild: boolean
  isExpanded: boolean
  children: React.ReactNode
}> = props => {
  const { id, isChild, isLastVisibleChild, isExpanded, children } = props
  const { setNodeRef } = useDroppable({
    id: 'envelope-drop' + id + isChild,
    data: { type: DragTypes.envelope, id, isLastVisibleChild, isExpanded },
  })

  return <div ref={setNodeRef}>{children}</div>
}

const RowWrapper: FC<
  BoxProps & {
    isChild: boolean
  }
> = props => {
  const { children, isChild, ...delegated } = props
  const style: SxProps = {
    ...rowStyle,
    position: 'relative',
    cursor: 'pointer',
    // transition: '0.1s',
    // borderRadius: 1,
    '&:hover': { bgcolor: 'action.hover', transition: '0.1s' },
    '&:active': { bgcolor: 'action.focus', transition: '0.1s' },
    // '&:focus': { bgcolor: 'action.focus' },
    '&:hover .addGoal': { opacity: 1, transition: '.3s' },
    '&:not(:hover) .addGoal': { opacity: 0 },
    '& > *': { py: isChild ? 0.5 : 1 },
  }
  // TODO: make it clickable in an accessible way
  return (
    <Box sx={style} {...delegated}>
      {children}
    </Box>
  )
}

type GoalButtonProps = {
  goal: TGoal | null
  goalProgress?: number | null
  onClick: IconButtonProps['onClick']
}
const GoalButton: FC<GoalButtonProps> = props => {
  const { goal, goalProgress, onClick } = props

  if (!goal) {
    return (
      <span className={'addGoal'}>
        <Tooltip title={'Добавить цель'}>
          <IconButton size="small" onClick={onClick}>
            <EmojiFlagsIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </span>
    )
  }

  return (
    <span>
      <Tooltip title={goalModel.toWords(goal)}>
        <IconButton size="small" onClick={onClick}>
          <RadialProgress value={goalProgress || 0} fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </span>
  )
}
