import React from 'react'
import {
  Typography,
  Box,
  Link,
  IconButton,
  useMediaQuery,
} from '@material-ui/core'
import { Tooltip } from 'components/Tooltip'
import { makeStyles } from '@material-ui/styles'
import EmojiIcon from 'components/EmojiIcon'
import { formatMoney } from 'helpers/format'
import WarningIcon from '@material-ui/icons/Warning'
import AddIcon from '@material-ui/icons/Add'
import EmojiFlagsIcon from '@material-ui/icons/EmojiFlags'
import NamePopover from './NamePopover'
import { goalToWords } from 'store/localData/hiddenData/goals/helpers'
import GoalProgress from 'components/GoalProgress'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import { getGoal } from 'store/localData/hiddenData/goals'
import { useSelector, shallowEqual } from 'react-redux'
import { getGoalProgress } from 'scenes/Budgets/selectors/goalsProgress'
import { Amount } from '../components'
import { useContext } from 'react'
import { IsDraggingContext, DragModeContext } from '../DnDContext'
import { getPopulatedTag } from 'store/localData/tags'
import { getAmountsForTag } from 'scenes/Budgets/selectors/getAmountsByTag'

const useStyles = makeStyles(theme => ({
  row: {
    paddingTop: ({ isChild }) => theme.spacing(isChild ? 0.5 : 1),
    paddingBottom: props => theme.spacing(props.isChild ? 0.5 : 1),
    paddingLeft: props => theme.spacing(props.isChild ? 8 : 3),
    paddingRight: theme.spacing(2),
    display: 'grid',
    width: '100%',
    gridTemplateColumns: 'auto 90px 90px 90px 16px',
    alignItems: 'center',
    gridColumnGap: theme.spacing(2),

    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: 'auto 90px 16px',
      gridColumnGap: theme.spacing(0.5),
    },

    '&:hover': {
      background: ({ isDragging }) =>
        isDragging ? 'none' : theme.palette.action.hover,
    },
    '&:hover .addGoal': { opacity: 1, transition: '.3s' },
    '&:not(:hover) .addGoal': { opacity: 0 },
  },

  warning: {
    transform: 'translateY(4px)',
    marginRight: theme.spacing(0.5),
  },
  dropZone: {
    background: theme.palette.action.selected,
    transition: '0.1s',
    borderRadius: theme.shape.borderRadius,
  },
}))

export function TagRow(props) {
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
  const amounts = useSelector(state => getAmountsForTag(state)(date, id))

  const isUnsorted = !tag.parent && isChild // реальная родительская категория
  let { showOutcome, symbol, colorRGB, name } = tag
  let budgeted = isChild ? amounts.budgeted : amounts.totalBudgeted
  let outcome = isChild ? amounts.outcome : amounts.totalOutcome
  let available = isChild ? amounts.available : amounts.totalAvailable

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
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('xs'))
  const c = useStyles({ isChild, isDragging })
  const [nameAnchorEl, setNameAnchorEl] = React.useState(null)

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

  const renderContent = (provided, snapshot) => (
    <div className={c.row} ref={provided?.innerRef}>
      <span style={{ display: 'none' }}>{provided?.placeholder}</span>
      <NameCell
        symbol={symbol}
        colorRGB={colorRGB}
        name={name}
        onOpenDetails={() => openDetails(id)}
        onEditName={e => setNameAnchorEl(e.currentTarget)}
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
          c={c}
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
    <>
      <Droppable
        droppableId={id || 'null'}
        type="FUNDS"
        isDropDisabled={isUnsorted}
      >
        {renderContent}
      </Droppable>

      {!!nameAnchorEl && (
        <NamePopover
          tag={id}
          anchorEl={nameAnchorEl}
          open={!!nameAnchorEl}
          style={{ transform: 'translate(-14px, -18px)' }}
          onClose={() => setNameAnchorEl(null)}
        />
      )}
    </>
  )
}

function NameCell({ symbol, colorRGB, name, onOpenDetails, onEditName }) {
  return (
    <Box display="flex" alignItems="center" minWidth={0}>
      <EmojiIcon
        symbol={symbol}
        mr={1.5}
        color={colorRGB}
        flexShrink={0}
        onClick={onOpenDetails}
      />
      <Typography variant="body1" color="textPrimary" noWrap>
        <span onClick={onEditName}>{name}</span>
      </Typography>
    </Box>
  )
}

function BudgetCell(props) {
  const { budgeted, showBudget, onBudgetClick, isUnsorted } = props
  return showBudget ? (
    <Box
      color={budgeted ? 'text.primary' : 'text.hint'}
      display="flex"
      justifyContent="flex-end"
    >
      <Link
        variant="body1"
        align="right"
        component="button"
        onClick={onBudgetClick}
      >
        <Amount value={budgeted} decMode="ifOnly" />
      </Link>
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

function OutcomeCell(props) {
  const { outcome, onClick } = props
  return (
    <Box color={outcome ? 'text.primary' : 'text.hint'} clone>
      <Typography variant="body1" align="right" onClick={onClick}>
        <Amount value={-outcome} decMode="ifOnly" />
      </Typography>
    </Box>
  )
}

function AvailableCell(props) {
  const {
    snapshot = {},
    dragMode,
    hiddenOverspend,
    id,
    available,
    isChild,
    budgeted,
    isUnsorted,
    c,
  } = props
  const availableColor = getAvailableColor(available, isChild, !!budgeted)

  const renderCellContent = (provided = {}, snapshot = {}) => (
    <Box
      borderRadius={16}
      bgcolor={snapshot.isDragging ? 'background.paper' : 'grey'}
      px={1}
      mx={-1}
      component="span"
      display="inline-block"
      color={availableColor}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={snapshot.isDragging ? provided.draggableProps.style : null}
    >
      <Amount value={available} decMode="ifOnly" />
    </Box>
  )

  return (
    <Box m={-1} p={1} className={snapshot.isDraggingOver ? c.dropZone : null}>
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
          <Draggable draggableId={id ? id : 'null'} index={0}>
            {renderCellContent}
          </Draggable>
        )}
      </Typography>
    </Box>
  )
}

function GoalButton(props) {
  const { goal, goalProgress, onClick } = props
  const hasGoal = !!goalProgress
  return (
    <Box component="span" className={hasGoal ? '' : 'addGoal'}>
      <Tooltip title={hasGoal ? goalToWords(goal) : 'Добавить цель'}>
        <IconButton size="small" onClick={onClick}>
          {hasGoal ? (
            <GoalProgress value={goalProgress.progress} fontSize="inherit" />
          ) : (
            <EmojiFlagsIcon fontSize="inherit" />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  )
}

// helpers

function getAvailableColor(available, isChild, hasBudget) {
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
