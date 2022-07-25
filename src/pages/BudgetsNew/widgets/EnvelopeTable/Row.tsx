import React, { FC } from 'react'
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
} from '@mui/material'
import { Tooltip } from 'shared/ui/Tooltip'
import { EmojiIcon } from 'shared/ui/EmojiIcon'
import { formatMoney } from 'shared/helpers/format'
import {
  WarningIcon,
  AddIcon,
  EmojiFlagsIcon,
  NotesIcon,
} from 'shared/ui/Icons'
import { RadialProgress } from 'shared/ui/RadialProgress'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import { Amount } from 'components/Amount'
import { useContext } from 'react'
import {
  IsDraggingContext,
  DragModeContext,
  DragModeType,
} from '../../components/DnDContext'
import { TFxAmount, TFxCode, TRates } from 'shared/types'
import { getUserCurrencyCode } from 'models/instrument'
import { SxProps } from '@mui/system'
import { useAppSelector } from 'store'
import { TEnvelopePopulated, useMonth, useRates } from '../../model'
import { convertFx, isZero } from 'shared/helpers/currencyHelpers'
import { keys } from 'shared/helpers/keys'
import { TEnvelopeId } from 'models/shared/envelopeHelpers'
import { goalToWords, TGoal } from 'models/goal'

type EnvelopeRowProps = {
  envelope: TEnvelopePopulated
  showAll?: boolean
  metric: 'available' | 'budgeted' | 'outcome'
  openDetails: (id: TEnvelopeId) => void
  openGoalPopover: (id: TEnvelopeId, target: Element) => void
  openBudgetPopover: (id: TEnvelopeId, target: Element) => void
  openTransactionsPopover: (id: TEnvelopeId) => void
}

export const Row: FC<EnvelopeRowProps> = props => {
  const {
    envelope,
    showAll,
    metric,
    openGoalPopover,
    openBudgetPopover,
    openTransactionsPopover,
    openDetails,
  } = props
  let { id, comment, currency, name, color, symbol, budgeted, isSelf } =
    envelope

  const { dragMode } = useContext(DragModeContext)
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))

  if (!envelope.isDefaultVisible && !showAll && dragMode !== 'REORDER') {
    return null
  }

  const isChild = !!envelope.parent || isSelf
  const showBudget = isChild ? !isZero(budgeted) : true

  return (
    <Wrapper
      id={id}
      isChild={isChild}
      enableDrop={dragMode === 'FUNDS' && !isSelf}
    >
      {/* Name cell */}
      <Box
        display="flex"
        alignItems="center"
        minWidth={0}
        onClick={() => openDetails(id)}
      >
        <EmojiIcon symbol={symbol} mr={1.5} color={color} />
        <Typography component="span" variant="body1" title={name} noWrap>
          {name}
        </Typography>
        {envelope.hasCustomCurency && <CurrencyTag currency={currency} />}
        {!!comment && (
          <Tooltip title={comment}>
            <NotesIcon
              sx={{ ml: 1, color: 'text.secondary' }}
              fontSize="small"
            />
          </Tooltip>
        )}
      </Box>

      {(metric === 'budgeted' || !isMobile) && (
        <BudgetCell
          isUnsorted={isSelf}
          budgeted={envelope.displayBudgeted}
          showBudget={showBudget}
          onBudgetClick={e => openBudgetPopover(id, e.currentTarget)}
        />
      )}

      {(metric === 'outcome' || !isMobile) && (
        <OutcomeCell
          activity={envelope.activity}
          displayActivity={envelope.displayActivity}
          onClick={e => openTransactionsPopover(id)}
        />
      )}

      {(metric === 'available' || !isMobile) && (
        <AvailableCell
          dragMode={dragMode}
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
    </Wrapper>
  )
}

const Wrapper: FC<{
  children?: React.ReactNode
  id: string
  enableDrop: boolean
  isChild: boolean
}> = props => {
  const { id, enableDrop, isChild, children } = props
  const isDragging = useContext(IsDraggingContext)
  const style: SxProps = {
    paddingLeft: isChild ? 8 : 3,
    paddingRight: 2,
    display: 'grid',
    width: '100%',
    gridTemplateColumns: {
      xs: 'auto 90px 16px',
      sm: 'auto 90px 90px 90px 16px',
    },
    transition: '0.1s',
    alignItems: 'center',
    justifyContent: 'initial',
    gridColumnGap: {
      xs: '4px',
      sm: '16px',
    },
    '&:hover': { bgcolor: isDragging ? 'none' : 'action.hover' },
    '&:hover .addGoal': { opacity: 1, transition: '.3s' },
    '&:not(:hover) .addGoal': { opacity: 0 },
    '& > *': { py: isChild ? 0.5 : 1 },
  }
  if (!enableDrop) {
    return <Box sx={style}>{children}</Box>
  }
  return (
    <Droppable type="FUNDS" droppableId={id}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          sx={{
            ...style,
            bgcolor: snapshot.isDraggingOver
              ? 'action.selected'
              : 'transparent',
          }}
        >
          <span style={{ display: 'none' }}>{provided.placeholder}</span>
          {children}
        </Box>
      )}
    </Droppable>
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
  const [month] = useMonth()
  const rates = useRates(month)
  const mainCurrency = useAppSelector(getUserCurrencyCode)
  const { activity, displayActivity, onClick } = props

  return (
    <Tooltip title={getAmountTitle(activity, mainCurrency, rates)}>
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
    </Tooltip>
  )
}

type AvailableCellProps = {
  dragMode: DragModeType
  hiddenOverspend?: number
  id: string
  available: number
  isChild?: boolean
  budgeted: number
  isUnsorted?: boolean
}
const AvailableCell: FC<AvailableCellProps> = props => {
  const {
    dragMode,
    hiddenOverspend,
    id,
    available,
    isChild,
    budgeted,
    isUnsorted,
  } = props
  const availableColor = getAvailableColor(available, isChild, !!budgeted)

  const renderCellContent = (provided?: any, snapshot?: any) => (
    <Box
      component="span"
      sx={{
        borderRadius: 2,
        bgcolor: !!provided ? 'background.paper' : '',
        px: 1,
        mx: -1,
        component: 'span',
        display: 'inline-block',
        color: availableColor,
      }}
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      style={snapshot?.isDragging ? provided?.draggableProps.style : null}
    >
      <Amount value={available} decMode="ifOnly" />
    </Box>
  )

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

        {isUnsorted || dragMode === 'REORDER' ? (
          renderCellContent()
        ) : (
          <Draggable draggableId={id || 'null'} index={0}>
            {renderCellContent}
          </Draggable>
        )}
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
