import React, { FC, useCallback } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
  Typography,
  Box,
  IconButton,
  useMediaQuery,
  Theme,
  IconButtonProps,
  Chip,
} from '@mui/material'
import { SxProps } from '@mui/system'
import { Tooltip } from '@shared/ui/Tooltip'
import { formatMoney, isZero, getCurrencySymbol } from '@shared/helpers/money'
import { WarningIcon, AddIcon, EmojiFlagsIcon } from '@shared/ui/Icons'
import { RadialProgress } from '@shared/ui/RadialProgress'
import { Amount } from '@shared/ui/Amount'
import { TEnvelopeId, TFxAmount, TFxCode } from '@shared/types'
import { goalModel, TGoal } from '@entities/goal'
import { DragTypes } from '../../DnDContext'
import { rowStyle } from '../shared/shared'
import { Metric } from '../models/useMetric'
import { TEnvelopePopulated } from '../models/getEnvelopeGroups'
import { useBudgetPopover } from '@pages/Budgets/BudgetPopover'
import { useGoalPopover } from '@pages/Budgets/GoalPopover'
import { NameCell } from './NameCell'
import { Btn } from './Btn'

type EnvelopeRowProps = {
  envelope: TEnvelopePopulated
  metric: Metric
  isBottom: boolean
  isReordering: boolean
  openDetails: (id: TEnvelopeId) => void
  openTransactionsPopover: (id: TEnvelopeId) => void
}

export const Row: FC<EnvelopeRowProps> = props => {
  const {
    envelope,
    metric,
    isReordering,
    openTransactionsPopover,
    openDetails,
  } = props
  const { id, totalBudgeted, isSelf } = envelope
  const isChild = !!envelope.env.parent || isSelf
  const showBudget = isChild ? !isZero(totalBudgeted) : true
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))
  const openBudgetPopover = useBudgetPopover()
  const openGoalPopover = useGoalPopover()

  const handleNameClick = useCallback(() => openDetails(id), [id, openDetails])

  return (
    <Droppable id={id} isChild={isChild}>
      <RowWrapper isChild={isChild}>
        <NameCell
          envelope={envelope.env}
          isChild={isChild}
          isDefaultVisible={envelope.isDefaultVisible}
          hasCustomCurency={envelope.hasCustomCurency}
          onClick={handleNameClick}
          isReordering={isReordering}
          dropIndicator={false}
        />

        {(metric === Metric.budgeted || !isMobile) && (
          <BudgetCell
            isUnsorted={isSelf}
            budgeted={envelope.displayBudgeted}
            showBudget={showBudget}
            onBudgetClick={e => openBudgetPopover(id, e.currentTarget)}
          />
        )}

        {(metric === Metric.outcome || !isMobile) && (
          <OutcomeCell
            activity={envelope.totalActivity}
            displayActivity={envelope.displayActivity}
            onClick={e => openTransactionsPopover(id)}
          />
        )}

        {(metric === Metric.available || !isMobile) && (
          <AvailableCell
            hiddenOverspend={envelope.displayHiddenOverspend}
            id={id}
            available={envelope.displayAvailable}
            isChild={isChild}
            budgeted={envelope.displayBudgeted}
            isUnsorted={isSelf}
          />
        )}

        {!isSelf && (
          <GoalButton
            goal={envelope.goal}
            goalProgress={envelope.goalProgress}
            onClick={e => openGoalPopover(id, e.currentTarget)}
          />
        )}
      </RowWrapper>
    </Droppable>
  )
}

const Droppable: FC<{
  id: TEnvelopeId
  isChild: boolean
  children: React.ReactNode
}> = props => {
  const { id, isChild, children } = props
  const { setNodeRef } = useDroppable({
    id: 'envelope-drop' + id + isChild,
    data: { type: DragTypes.envelope, id },
  })

  return <div ref={setNodeRef}>{children}</div>
}

const RowWrapper: FC<{
  children: React.ReactNode
  isChild: boolean
}> = props => {
  const { children, isChild } = props
  const style: SxProps = {
    ...rowStyle,
    position: 'relative',
    transition: '0.1s',
    '&:hover': { bgcolor: 'action.hover' },
    '&:hover .addGoal': { opacity: 1, transition: '.3s' },
    '&:not(:hover) .addGoal': { opacity: 0 },
    '& > *': { py: isChild ? 0.5 : 1 },
  }
  return <Box sx={style}>{children}</Box>
}

export const CurrencyTag: FC<{ currency?: TFxCode }> = ({ currency }) => {
  if (!currency) return null
  return (
    <Tooltip
      title={`Бюджет этой категории задаётся в ${currency}. Он будет пересчитываться автоматически по текущему курсу.`}
    >
      <Chip label={getCurrencySymbol(currency)} size="small" />
    </Tooltip>
  )
}

type BudgetCellProps = {
  budgeted: number
  showBudget?: boolean
  isUnsorted?: boolean
  onBudgetClick: React.MouseEventHandler<HTMLButtonElement>
}
const BudgetCell: FC<BudgetCellProps> = props => {
  const { budgeted, showBudget, onBudgetClick, isUnsorted } = props
  return showBudget ? (
    <Box
      color={budgeted ? 'text.primary' : 'text.hint'}
      display="flex"
      justifyContent="flex-end"
    >
      <Btn onClick={onBudgetClick}>
        <Amount value={budgeted} decMode="ifOnly" />
      </Btn>
    </Box>
  ) : (
    <Box display="flex" justifyContent="flex-end">
      <Tooltip
        title={
          isUnsorted
            ? 'Просто увеличьте бюджет всей группы 😉'
            : 'Добавить бюджет'
        }
      >
        <span>
          <IconButton
            size="small"
            edge="end"
            children={<AddIcon fontSize="inherit" />}
            onClick={onBudgetClick}
            disabled={isUnsorted}
          />
        </span>
      </Tooltip>
    </Box>
  )
}

type OutcomeCellProps = {
  activity: TFxAmount
  displayActivity: number
  onClick: React.MouseEventHandler<HTMLButtonElement>
}
const OutcomeCell: FC<OutcomeCellProps> = props => {
  const { displayActivity, onClick } = props
  return (
    <Box
      display="flex"
      justifyContent="flex-end"
      color={displayActivity ? 'text.primary' : 'text.hint'}
    >
      <Btn onClick={onClick}>
        <Typography variant="body1" align="right">
          <Amount value={displayActivity} decMode="ifOnly" />
        </Typography>
      </Btn>
    </Box>
  )
}

const Draggable: FC<{
  id: string
  children: React.ReactNode
  type: DragTypes
  disabled?: boolean
}> = props => {
  const { id, children, disabled, type } = props
  const { setNodeRef, attributes, listeners } = useDraggable({
    id: 'amount' + id,
    disabled,
    data: { type, id },
  })
  return (
    <span ref={setNodeRef} {...attributes} {...listeners}>
      {children}
    </span>
  )
}

type AvailableCellProps = {
  hiddenOverspend?: number
  id: string
  available: number
  isChild?: boolean
  budgeted: number
  isUnsorted?: boolean
}
const AvailableCell: FC<AvailableCellProps> = props => {
  const { hiddenOverspend, id, available, isChild, budgeted, isUnsorted } =
    props
  const availableColor = getAvailableColor(available, isChild, !!budgeted)

  return (
    <Box>
      <Typography variant="body1" align="right">
        {!!hiddenOverspend && (
          <Tooltip
            title={
              <span>
                Перерасход в родительской категории.
                <br />
                {`Увеличьте бюджет на ${formatMoney(-hiddenOverspend)}`}
              </span>
            }
          >
            <WarningIcon
              fontSize="small"
              color="warning"
              sx={{ transform: 'translate(-6px, 4px)' }}
            />
          </Tooltip>
        )}

        <Draggable id={id} type={DragTypes.amount} disabled={isUnsorted}>
          <Box
            component="span"
            sx={{
              borderRadius: 1,
              px: 2,
              mx: -2,
              py: 0.5,
              my: -0.5,
              component: 'span',
              display: 'inline-block',
              color: availableColor,
              touchAction: 'none',
              cursor: 'grab',
            }}
          >
            <Amount value={available} decMode="ifOnly" />
          </Box>
        </Draggable>
      </Typography>
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

// helpers

function getAvailableColor(
  available: number,
  isChild?: boolean,
  hasBudget?: boolean
) {
  const positive = 'success.main'
  const negative = 'error.main'
  const neutral = 'text.hint'

  if (available === 0) return neutral
  if (available > 0) return positive

  // available < 0
  // main tag or child with budget
  if (!isChild || hasBudget) return negative
  // child tag without budget
  else return neutral
}
