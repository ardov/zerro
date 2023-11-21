import React, { FC, ReactNode, useCallback } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { IconButton, IconButtonProps } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '6-shared/ui/Tooltip'
import { EmojiFlagsIcon } from '6-shared/ui/Icons'
import { RadialProgress } from '6-shared/ui/RadialProgress'
import { TFxCode, TISOMonth } from '6-shared/types'

import { goalModel, TGoal } from '5-entities/goal'
import { balances } from '5-entities/envBalances'
import { envelopeModel, TEnvelopeId } from '5-entities/envelope'
import { displayCurrency } from '5-entities/currency/displayCurrency'

import { DragTypes } from '../../DnDContext'
import { useBudgetPopover } from '../../BudgetPopover'
import { useGoalPopover } from '../../GoalPopover'

import { TableRow } from '../shared/shared'
import { NameCell } from './NameCell'
import { BudgetCell } from './BudgetCell'
import { ActivityCell } from './ActivityCell'
import { AvailableCell } from './AvailableCell'

type EnvelopeRowProps = {
  id: TEnvelopeId
  month: TISOMonth
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
      e => {
        e.preventDefault()
        e.stopPropagation()
        openGoalPopover(id, e.currentTarget)
      },
      [id, openGoalPopover]
    )

  return (
    <Droppable
      id={id}
      isChild={isChild}
      isLastVisibleChild={!!isLastVisibleChild}
      isExpanded={!!isExpanded}
    >
      <TableRow
        sx={{
          position: 'relative',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover', transition: '0.1s' },
          '&:active': { bgcolor: 'action.focus', transition: '0.1s' },
          '&:hover .addGoal': { opacity: 1, transition: '.3s' },
          '&:not(:hover) .addGoal': { opacity: 0 },
          '& > *': { py: isChild ? 0.5 : 1 },
        }}
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
        budgeted={
          <BudgetCell
            isSelf={isSelf}
            value={budgeted}
            onBudgetClick={e => openBudgetPopover(id, e.currentTarget)}
          />
        }
        outcome={
          <ActivityCell
            value={activity}
            onClick={e => openTransactionsPopover(id)}
          />
        }
        available={
          <AvailableCell
            hiddenOverspend={hiddenOverspend}
            id={id}
            available={available}
            isChild={isChild}
            budgeted={budgeted}
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
    </Droppable>
  )
}

const Droppable: FC<{
  id: TEnvelopeId
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
  goal: TGoal | null
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
      <Tooltip title={goalModel.toWords(goal, currency)}>
        <IconButton size="small" onClick={onClick}>
          <RadialProgress value={goalProgress || 0} fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </span>
  )
}
