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
import { Tooltip } from 'components/Tooltip'
import { makeStyles } from '@mui/styles'
import { EmojiIcon } from 'components/EmojiIcon'
import { formatMoney } from 'helpers/format'
import WarningIcon from '@mui/icons-material/Warning'
import AddIcon from '@mui/icons-material/Add'
import EmojiFlagsIcon from '@mui/icons-material/EmojiFlags'
import { goalToWords } from 'store/data/hiddenData/goals/helpers'
import { GoalProgress } from 'components/GoalProgress'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import { getGoal } from 'store/data/hiddenData/goals'
import { useSelector, shallowEqual } from 'react-redux'
import {
  getGoalProgress,
  GoalProgress as GoalProgressType,
} from 'scenes/Budgets/selectors/goalsProgress'
import { Amount } from 'components/Amount'
import { useContext } from 'react'
import { IsDraggingContext, DragModeContext, DragModeType } from '../DnDContext'
import { getPopulatedTag } from 'store/data/tags'
import { getAmountsById } from 'scenes/Budgets/selectors'
import { Goal } from 'types'
import { getTagMeta } from 'store/data/hiddenData/tagMeta'
import SmsIcon from '@mui/icons-material/Sms'
import { getInstruments } from 'store/data/instruments'

const useStyles = makeStyles(theme => ({
  row: {
    paddingTop: (p: any) => theme.spacing(p.isChild ? 0.5 : 1),
    paddingBottom: (p: any) => theme.spacing(p.isChild ? 0.5 : 1),
    paddingLeft: (p: any) => theme.spacing(p.isChild ? 8 : 3),
    paddingRight: theme.spacing(2),
    display: 'grid',
    width: '100%',
    gridTemplateColumns: 'auto 90px 90px 90px 16px',
    alignItems: 'center',
    gridColumnGap: theme.spacing(2),

    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: 'auto 90px 16px',
      gridColumnGap: theme.spacing(0.5),
    },

    '&:hover': {
      background: (p: any) =>
        p.isDragging ? 'none' : theme.palette.action.hover,
    },
    '&:hover .addGoal': { opacity: 1, transition: '.3s' },
    '&:not(:hover) .addGoal': { opacity: 0 },
  },
}))

type TagRowProps = {
  id: string
  isChild?: boolean
  hiddenOverspend?: number
  date: number
  showAll?: boolean
  metric: 'available' | 'budgeted' | 'outcome'
  openDetails: (id: string) => void
  openGoalPopover: (id: string, target: Element) => void
  openBudgetPopover: (id: string, target: Element) => void
  openTransactionsPopover: (id: string) => void
}

export const TagRow: FC<TagRowProps> = props => {
  const {
    id,
    isChild,
    hiddenOverspend,
    date,
    showAll,
    metric,
    openGoalPopover,
    openBudgetPopover,
    openTransactionsPopover,
    openDetails,
  } = props
  const tag = useSelector(state => getPopulatedTag(state, id))
  const { comment, currency } = useSelector(getTagMeta)?.[id] || {}
  const amounts = useSelector(getAmountsById)?.[date]?.[id]

  const isUnsorted = !tag.parent && isChild // реальная родительская категория
  let { showOutcome, symbol, colorRGB, name } = tag
  let budgeted = amounts.totalBudgeted
  let outcome = amounts.totalOutcome
  let available = amounts.totalAvailable

  if (isUnsorted) {
    symbol = '-'
    colorRGB = null
    name = 'Без подкатегории'
    budgeted = 0
    available = 0
  }

  const isDragging = useContext(IsDraggingContext)
  const { dragMode } = useContext(DragModeContext)
  const goal = useSelector(state => getGoal(state, id), shallowEqual)
  const goalProgress = useSelector(
    state => getGoalProgress(state, date, id),
    shallowEqual
  )
  const isMobile = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'))
  const c = useStyles({ isChild, isDragging })

  if (
    !showOutcome &&
    !budgeted &&
    !outcome &&
    !available &&
    !showAll &&
    dragMode !== 'REORDER'
  )
    return null

  const showBudget = isChild ? !!budgeted : true

  const renderContent = (provided?: any, snapshot?: any) => (
    <div className={c.row} ref={provided?.innerRef}>
      <span style={{ display: 'none' }}>{provided?.placeholder}</span>
      <NameCell
        symbol={symbol}
        colorRGB={colorRGB}
        name={name}
        comment={comment}
        currency={currency}
        onOpenDetails={() => openDetails(id)}
      />

      {(metric === 'budgeted' || !isMobile) && (
        <BudgetCell
          isUnsorted={isUnsorted}
          budgeted={budgeted}
          showBudget={showBudget}
          onBudgetClick={e => openBudgetPopover(id, e.currentTarget)}
        />
      )}

      {(metric === 'outcome' || !isMobile) && (
        <OutcomeCell
          outcome={outcome}
          onClick={() => openTransactionsPopover(id)}
        />
      )}

      {(metric === 'available' || !isMobile) && (
        <AvailableCell
          snapshot={snapshot}
          dragMode={dragMode}
          hiddenOverspend={hiddenOverspend}
          id={id}
          available={available}
          isChild={isChild}
          budgeted={budgeted}
          isUnsorted={isUnsorted}
        />
      )}

      <GoalButton
        goal={goal}
        goalProgress={goalProgress}
        onClick={e => openGoalPopover(id, e.currentTarget)}
      />
    </div>
  )

  if (dragMode === 'REORDER') return renderContent()

  return (
    <Droppable
      droppableId={id || 'null'}
      type="FUNDS"
      isDropDisabled={isUnsorted}
    >
      {renderContent}
    </Droppable>
  )
}

const Btn: FC<ButtonBaseProps> = props => (
  <ButtonBase
    sx={{
      p: 0.5,
      m: -0.5,
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

type NameCellProps = {
  symbol: string
  colorRGB: string | null
  name: string
  comment?: string
  currency?: number
  onOpenDetails: () => void
}
const NameCell: FC<NameCellProps> = ({
  symbol,
  colorRGB,
  name,
  comment,
  currency,
  onOpenDetails,
}) => {
  return (
    <Box display="flex" alignItems="center" minWidth={0}>
      <Btn onClick={onOpenDetails}>
        <EmojiIcon symbol={symbol} mr={1.5} color={colorRGB} />
        <Typography component="span" variant="body1" title={name} noWrap>
          {name}
        </Typography>
        <CurrencyTag currency={currency} />
        {!!comment && (
          <Tooltip title={comment}>
            <SmsIcon sx={{ ml: 1, color: 'text.secondary' }} fontSize="small" />
          </Tooltip>
        )}
      </Btn>
    </Box>
  )
}

type CurrencyTagProps = {
  currency?: number
}
const CurrencyTag: FC<CurrencyTagProps> = ({ currency }) => {
  const instruments = useSelector(getInstruments)
  if (!currency) return null
  const instrument = instruments[currency]
  const currCode = instrument?.symbol
  return (
    <Tooltip
      title={`Бюджет этой категории задаётся в ${instrument.shortTitle}. Он будет пересчитываться автоматически по текущему курсу.`}
    >
      <Chip label={currCode} sx={{ ml: 1 }} size="small" />
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
  outcome: number
  onClick: () => void
}
const OutcomeCell: FC<OutcomeCellProps> = props => {
  const { outcome, onClick } = props
  return (
    <Box
      display="flex"
      justifyContent="flex-end"
      color={outcome ? 'text.primary' : 'text.hint'}
    >
      <Btn onClick={onClick}>
        <Typography variant="body1" align="right">
          <Amount value={-outcome} decMode="ifOnly" />
        </Typography>
      </Btn>
    </Box>
  )
}

type AvailableCellProps = {
  snapshot?: any
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
    snapshot = {},
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
    <Box
      sx={{
        bgcolor: snapshot.isDraggingOver ? 'action.selected' : 'transparent',
        transition: '0.1s',
        borderRadius: 1,
        m: -1,
        p: 1,
      }}
    >
      <Typography variant="body1" align="right">
        {!!hiddenOverspend && (
          <Tooltip
            title={
              <span>
                Перерасход в родительской категории.
                <br />
                {`Увеличьте бюджет на ${formatMoney(hiddenOverspend)}`}
              </span>
            }
          >
            <WarningIcon fontSize="small" color="error" />
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
  goal: Goal
  goalProgress?: GoalProgressType | null
  onClick: IconButtonProps['onClick']
}

const GoalButton: FC<GoalButtonProps> = props => {
  const { goal, goalProgress, onClick } = props

  if (!goalProgress) {
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
          <GoalProgress value={goalProgress.progress} fontSize="inherit" />
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
