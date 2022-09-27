import React, { FC, useCallback } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
  Typography,
  Box,
  IconButton,
  useMediaQuery,
  ButtonBase,
  Theme,
  IconButtonProps,
  ButtonBaseProps,
  Chip,
  Collapse,
} from '@mui/material'
import { SxProps } from '@mui/system'
import { Tooltip } from '@shared/ui/Tooltip'
import { EmojiIcon } from '@shared/ui/EmojiIcon'
import { formatMoney, convertFx, isZero } from '@shared/helpers/money'
import { keys } from '@shared/helpers/keys'
import {
  WarningIcon,
  AddIcon,
  EmojiFlagsIcon,
  NotesIcon,
  DragIndicatorIcon,
} from '@shared/ui/Icons'
import { RadialProgress } from '@shared/ui/RadialProgress'
import { Amount } from '@shared/ui/Amount'
import { TEnvelopeId, TFxAmount, TFxCode, TRates } from '@shared/types'
import { goalToWords, TGoal } from '@entities/goal'
import { DragTypes } from '../../DnDContext'
import { rowStyle } from '../shared/shared'
import { Metric } from '../models/useMetric'
import { TEnvelopePopulated } from '../models/getEnvelopeGroups'
import { useBudgetPopover } from '@pages/Budgets/BudgetPopover'
import { useGoalPopover } from '@pages/Budgets/GoalPopover'

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
  const isChild = !!envelope.parent || isSelf
  const showBudget = isChild ? !isZero(totalBudgeted) : true
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))
  const openBudgetPopover = useBudgetPopover()
  const openGoalPopover = useGoalPopover()

  const handleNameClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.altKey) console.log(envelope.name, envelope)
      else openDetails(id)
    },
    [envelope, id, openDetails]
  )

  return (
    <Droppable id={id} isChild={isChild}>
      <NameCell
        envelope={envelope}
        onClick={handleNameClick}
        isReordering={isReordering}
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
    </Droppable>
  )
}

const NameCell: FC<{
  envelope: TEnvelopePopulated
  isReordering: boolean
  onClick: (e: React.MouseEvent) => void
}> = props => {
  const { isReordering } = props
  const {
    id,
    symbol,
    color,
    name,
    hasCustomCurency,
    currency,
    comment,
    isDefaultVisible,
  } = props.envelope
  const { setNodeRef, attributes, listeners } = useDraggable({
    id: 'envelope' + id,
    data: { type: DragTypes.envelope, id: id },
  })
  return (
    <Box display="flex" alignItems="center" minWidth={0}>
      <Collapse orientation="horizontal" in={isReordering}>
        <IconButton
          size="small"
          sx={{ ml: 1, display: 'grid', placeItems: 'center', cursor: 'grab' }}
          ref={setNodeRef}
          {...attributes}
          {...listeners}
        >
          <DragIndicatorIcon />
        </IconButton>
      </Collapse>

      <ButtonBase
        sx={{
          p: 0.5,
          m: -0.5,
          borderRadius: 1,
          minWidth: 0,
          transition: '0.1s',
          typography: 'body1',
          opacity: isDefaultVisible ? 1 : 0.5,
          '&:hover': { bgcolor: 'action.hover', opacity: 1 },
          '&:focus': { bgcolor: 'action.focus' },
        }}
        onClick={props.onClick}
      >
        <EmojiIcon symbol={symbol} mr={1.5} color={color} />
        <Typography component="span" variant="body1" title={name} noWrap>
          {name}
        </Typography>
      </ButtonBase>

      {hasCustomCurency && <CurrencyTag currency={currency} />}

      {!!comment && (
        <Tooltip title={comment}>
          <NotesIcon sx={{ ml: 1, color: 'text.secondary' }} fontSize="small" />
        </Tooltip>
      )}
    </Box>
  )
}

const Droppable: FC<{
  id: TEnvelopeId
  isChild: boolean
  children: React.ReactNode
}> = props => {
  const { id, isChild, children } = props
  const { setNodeRef, isOver, active } = useDroppable({
    id: 'envelope-drop' + id + isChild,
    data: { type: DragTypes.envelope, id },
  })

  const isAmount = active?.data.current?.type === DragTypes.amount

  const style: SxProps = {
    ...rowStyle,
    pl: isChild ? 7 : 2,
    bgcolor: isOver && isAmount ? 'action.selected' : 'transparent',
    position: 'relative',
    transition: '0.1s',
    '&:hover': { bgcolor: isAmount ? 'none' : 'action.hover' },
    '&:hover .addGoal': { opacity: 1, transition: '.3s' },
    '&:not(:hover) .addGoal': { opacity: 0 },
    '& > *': { py: isChild ? 0.5 : 1 },
  }
  return (
    <Box ref={setNodeRef} sx={style}>
      {children}
    </Box>
  )
}

const Btn: FC<ButtonBaseProps> = props => (
  <ButtonBase
    sx={{
      py: 1,
      px: 1.5,
      my: -1,
      mx: -1.5,
      borderRadius: 1,
      minWidth: 0,
      transition: '0.1s',
      textAlign: 'right',
      typography: 'body1',
      '&:hover': { bgcolor: 'action.hover' },
      '&:focus': { bgcolor: 'action.focus' },
    }}
    {...props}
  />
)

const CurrencyTag: FC<{ currency?: TFxCode }> = ({ currency }) => {
  if (!currency) return null
  return (
    <Tooltip
      title={`Бюджет этой категории задаётся в ${currency}. Он будет пересчитываться автоматически по текущему курсу.`}
    >
      <Chip label={currency} sx={{ ml: 1 }} size="small" />
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
              // bgcolor: isDragging ? 'background.paper' : '',
              px: 2,
              mx: -2,
              py: 0.5,
              my: -0.5,
              component: 'span',
              display: 'inline-block',
              color: availableColor,
              touchAction: 'none',
              // transform: CSS.Translate.toString(transform),
              // cursor: isDragging ? 'grabbing' : 'grab',
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
      <Tooltip title={goalToWords(goal)}>
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

function getAmountTitle(amount: TFxAmount, currency: TFxCode, rates: TRates) {
  if (isZero(amount)) return <span>0</span>
  const codes = keys(amount)
  if (codes.length === 0) return <span>0</span>

  let strings = codes.map(fx => {
    if (fx === currency) return formatMoney(amount[fx], fx)
    let converted = convertFx({ [fx]: amount[fx] }, currency, rates)
    return `${formatMoney(amount[fx], fx)} (${formatMoney(
      converted,
      currency
    )})`
  })
  if (strings.length > 1)
    strings.push(
      `Итого: ${formatMoney(convertFx(amount, currency, rates), currency)}`
    )
  return (
    <span>
      {strings.map(s => (
        <span key={s}>
          <span>{s}</span>
          <br />
        </span>
      ))}
    </span>
  )
}
