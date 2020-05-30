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
import { goalToWords } from 'store/localData/hiddenData/goals'
import GoalProgress from 'components/GoalProgress'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import { getGoal } from 'store/localData/hiddenData'
import { useSelector, shallowEqual } from 'react-redux'
import { getGoalProgress } from 'scenes/Budgets/selectors/goalsProgress'
import { Amount } from '../components'
import { useContext } from 'react'
import { IsDraggingContext } from '../DnDContext'

const useStyles = makeStyles(theme => ({
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
      background: ({ isDragging }) =>
        isDragging ? 'none' : theme.palette.action.hover,
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
  dropZone: {
    background: theme.palette.action.selected,
    transition: '0.1s',
    borderRadius: theme.shape.borderRadius,
  },
}))

export function TagRow(props) {
  const {
    id,
    symbol,
    name,
    colorRGB,
    showOutcome,
    isChild,
    hiddenOverspend,
    date,

    budgeted = 0,
    outcome = 0,
    available = 0,

    showAll,
    metric,

    openGoalPopover,
    openBudgetPopover,
    openTransactionsPopover,
    openDetails,
  } = props
  const isDragging = useContext(IsDraggingContext)
  const goal = useSelector(state => getGoal(state, id), shallowEqual)
  const goalProgress = useSelector(
    state => getGoalProgress(state, date, id),
    shallowEqual
  )
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('xs'))
  const c = useStyles({ isChild, isMobile, isDragging })
  const [nameAnchorEl, setNameAnchorEl] = React.useState(null)

  if (!showOutcome && !outcome && !available && !showAll) return null

  const showBudget = isChild ? !!budgeted : true

  const availableColor = getAvailableColor(available, isChild, !!budgeted)

  return (
    <div className={c.row}>
      <div className={c.name}>
        <EmojiIcon
          symbol={symbol}
          mr={1.5}
          color={colorRGB}
          flexShrink={0}
          onClick={() => openDetails(id)}
        />
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
              onClick={e => openBudgetPopover(id, e.currentTarget)}
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
                  onClick={e => openBudgetPopover(id, e.currentTarget)}
                  disabled={id === 'unsorted'}
                />
              </span>
            </Tooltip>
          </Box>
        ))}

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
            onClick={() => openTransactionsPopover(id)}
          >
            {formatMoney(outcome ? -outcome : 0)}
          </Typography>
        </Box>
      )}

      {/* AVAILABLE */}
      {(metric === 'available' || !isMobile) && (
        <Droppable
          droppableId={id ? id : 'null'}
          type="FUNDS"
          // direction="horizontal"
        >
          {({ innerRef, placeholder }, snapshot) => (
            <Box
              ref={innerRef}
              m={-1}
              p={1}
              className={snapshot.isDraggingOver ? c.dropZone : null}
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

                <span style={{ display: 'none' }}>{placeholder}</span>
                <Draggable draggableId={id ? id : 'null'} index={0}>
                  {(provided, snapshot) => (
                    <Box
                      borderRadius={16}
                      bgcolor={
                        snapshot.isDragging ? 'background.paper' : 'grey'
                      }
                      px={1}
                      mx={-1}
                      component="span"
                      display="inline-block"
                      color={availableColor}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={
                        snapshot.isDragging
                          ? provided.draggableProps.style
                          : null
                      }
                    >
                      <Amount value={available} />
                    </Box>
                  )}
                </Draggable>

                <Box
                  component="span"
                  display="inline-block"
                  ml={1}
                  maxWidth={16}
                >
                  {!snapshot.isDragging &&
                    (goalProgress ? (
                      <Tooltip title={goalToWords(goal)}>
                        <IconButton
                          size="small"
                          onClick={e => openGoalPopover(id, e.currentTarget)}
                          edge="start"
                          children={
                            <GoalProgress value={goalProgress.progress} />
                          }
                        />
                      </Tooltip>
                    ) : (
                      <Box component="span" className="addGoal">
                        <Tooltip title="Добавить цель">
                          <IconButton
                            size="small"
                            onClick={e => openGoalPopover(id, e.currentTarget)}
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
        </Droppable>
      )}
    </div>
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
