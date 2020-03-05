import React from 'react'
import {
  Typography,
  Box,
  Link,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import EmojiIcon from 'components/EmojiIcon'
import { formatMoney } from 'helpers/format'
import WarningIcon from '@material-ui/icons/Warning'
import AddIcon from '@material-ui/icons/Add'
import EmojiFlagsIcon from '@material-ui/icons/EmojiFlags'
import BudgetPopover from './BudgetPopover'
import NamePopover from './NamePopover'
import { goalToWords } from 'store/localData/budgets/helpers'
import GoalProgress from 'components/GoalProgress'
import { Droppable, Draggable } from 'react-beautiful-dnd'

export const useStyles = makeStyles(theme => ({
  row: {
    paddingTop: ({ isChild }) => theme.spacing(isChild ? 0.5 : 1),
    paddingBottom: props => theme.spacing(props.isChild ? 0.5 : 1),
    paddingLeft: props => theme.spacing(props.isChild ? 9 : 4),
    paddingRight: theme.spacing(2),
    display: 'grid',
    width: '100%',
    gridTemplateColumns: ({ isMobile }) =>
      isMobile ? 'auto 120px' : 'auto 120px 120px 120px',
    alignItems: 'center',
    gridColumnGap: ({ isMobile }) =>
      isMobile ? theme.spacing(0.5) : theme.spacing(3),

    '&:hover': {
      background: theme.palette.action.hover,
    },
    '&:hover .addGoal': {
      opacity: 1,
      transition: '.3s',
    },
    '&:not(:hover) .addGoal': {
      opacity: 0,
    },
  },
  name: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
  },
  warning: {
    transform: 'translateY(4px)',
    marginRight: theme.spacing(0.5),
  },
}))

export function TagRow(props) {
  const {
    metric,
    id,
    symbol,
    name,
    budgeted,
    outcome,
    available,
    colorRGB,
    isChild,
    goal,
    isHidden,

    hasOverspent,
    setBudget,
    date,
    onSelect,

    openGoalPopover,
  } = props
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('xs'))
  const c = useStyles({ isChild, isMobile })
  const [budgetAnchorEl, setBudgetAnchorEl] = React.useState(null)
  const [nameAnchorEl, setNameAnchorEl] = React.useState(null)
  const showBudget = isChild ? !!budgeted : true
  const goalProgress =
    goal && goal.type === 'monthly' ? budgeted / goal.amount : 0

  const handleBudgetChange = amount => {
    setBudgetAnchorEl(null)
    if (amount !== budgeted) setBudget(amount, date, id)
  }

  const availableColor = getAvailableColor(
    available,
    hasOverspent,
    isChild,
    !!budgeted
  )
  const hasInnerOverspent = !isChild && hasOverspent //&& available >= 0

  return (
    <div className={c.row}>
      <div className={c.name}>
        <EmojiIcon symbol={symbol} mr={1.5} color={colorRGB} flexShrink={0} />
        <Typography variant="body1" color="textPrimary" noWrap>
          <span onClick={e => setNameAnchorEl(e.currentTarget)}>{name}</span>
        </Typography>
      </div>

      {/* BUDGET */}
      {(metric === 'budgeted' || !isMobile) &&
        (showBudget ? (
          <Box
            color={budgeted ? 'text.primary' : 'text.hint'}
            display="flex"
            justifyContent="flex-end"
          >
            <Link
              variant="body1"
              align="right"
              component="button"
              onClick={e => setBudgetAnchorEl(e.currentTarget)}
            >
              {formatMoney(budgeted)}
            </Link>
          </Box>
        ) : (
          <Box display="flex" justifyContent="flex-end">
            <Tooltip
              title={
                id === 'unsorted'
                  ? 'Просто увеличьте бюджет всей группы 😉'
                  : 'Добавить бюджет'
              }
            >
              <span>
                <IconButton
                  size="small"
                  edge="end"
                  children={<AddIcon />}
                  onClick={e => setBudgetAnchorEl(e.currentTarget)}
                  disabled={id === 'unsorted'}
                />
              </span>
            </Tooltip>
          </Box>
        ))}

      {!!budgetAnchorEl && (
        <BudgetPopover
          key={`${id}${budgeted}`}
          budgeted={budgeted}
          available={available}
          prevBudgeted={0}
          style={{ transform: 'translate(-14px, -16px)' }}
          anchorEl={budgetAnchorEl}
          goal={goal}
          needForGoal={goal && goal.amount}
          open={!!budgetAnchorEl}
          onChange={handleBudgetChange}
        />
      )}

      {!!nameAnchorEl && (
        <NamePopover
          tag={id}
          anchorEl={nameAnchorEl}
          open={!!nameAnchorEl}
          style={{ transform: 'translate(-14px, -18px)' }}
          onClose={() => setNameAnchorEl(null)}
        />
      )}

      {/* OUTCOME */}
      {(metric === 'outcome' || !isMobile) && (
        <Box color={outcome ? 'text.primary' : 'text.hint'} clone>
          <Typography
            variant="body1"
            align="right"
            onClick={() => onSelect(id)}
          >
            {formatMoney(outcome ? -outcome : 0)}
          </Typography>
        </Box>
      )}

      {/* AVAILABLE */}
      {(metric === 'available' || !isMobile) && (
        <Droppable
          droppableId={id ? id : 'null'}
          isDropDisabled={isHidden}
          type="FUNDS"
        >
          {({ innerRef, placeholder }, snapshot) => (
            <div ref={innerRef} style={getDroppableStyle(snapshot)}>
              <span style={{ display: 'none' }}>{placeholder}</span>

              <Draggable draggableId={id ? id : 'null'} index={0}>
                {(provided, snapshot) => (
                  <Box
                    p={0.5}
                    m={-0.5}
                    borderRadius={16}
                    bgcolor={snapshot.isDragging ? 'background.paper' : ''}
                    color={availableColor}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={
                      snapshot.isDragging
                        ? { ...provided.draggableProps.style }
                        : {}
                    }
                  >
                    <Typography variant="body1" align="right">
                      {hasInnerOverspent && (
                        <WarningIcon
                          color="error"
                          fontSize="small"
                          className={c.warning}
                        />
                      )}
                      {formatMoney(available)}
                      <Box
                        component="span"
                        display="inline-block"
                        ml={1}
                        maxWidth={16}
                      >
                        {!snapshot.isDragging &&
                          (goal ? (
                            <Tooltip title={goalToWords(goal)}>
                              <IconButton
                                size="small"
                                onClick={e =>
                                  openGoalPopover(id, e.currentTarget)
                                }
                                edge="start"
                                children={<GoalProgress value={goalProgress} />}
                              />
                            </Tooltip>
                          ) : (
                            <Box component="span" className="addGoal">
                              <Tooltip title="Добавить цель">
                                <IconButton
                                  size="small"
                                  onClick={e =>
                                    openGoalPopover(id, e.currentTarget)
                                  }
                                  edge="start"
                                  children={<EmojiFlagsIcon fontSize="small" />}
                                />
                              </Tooltip>
                            </Box>
                          ))}
                      </Box>
                    </Typography>
                  </Box>
                )}
              </Draggable>
            </div>
          )}
        </Droppable>
      )}
    </div>
  )
}

// helpers

function getDroppableStyle(snapshot) {
  return {
    opacity: snapshot.isDraggingOver ? 0.5 : 1,
    // transform: `scale(${snapshot.isDraggingOver ? 1.1 : 1})`,
    transitionDuration: `0.2s`,
  }
}

function getAvailableColor(available, hasOverspent, isChild, hasBudget) {
  const positive = 'success.main',
    negative = 'error.main',
    neutral = 'text.hint'

  if (!isChild || hasBudget) {
    return available === 0 ? neutral : available < 0 ? negative : positive
  } else {
    // child tag without budget
    return available > 0
      ? positive
      : available === 0
      ? neutral
      : hasOverspent
      ? negative
      : neutral
  }
}
