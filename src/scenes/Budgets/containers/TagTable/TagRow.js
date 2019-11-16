import React from 'react'
import { Typography, Box, Link, IconButton, Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import EmojiIcon from 'components/EmojiIcon'
import { formatMoney } from 'helpers/format'
import WarningIcon from '@material-ui/icons/Warning'
import AddIcon from '@material-ui/icons/Add'
import BudgetPopover from './BudgetPopover'

export const useStyles = makeStyles(theme => ({
  row: {
    paddingTop: ({ isChild }) => theme.spacing(isChild ? 0.5 : 1),
    paddingBottom: props => theme.spacing(props.isChild ? 0.5 : 1),
    paddingLeft: props => theme.spacing(props.isChild ? 9 : 4),
    paddingRight: theme.spacing(2),
    display: 'grid',
    width: '100%',
    gridTemplateColumns: 'auto 120px 120px 120px',
    gridTemplateAreas: `"name budget outcome available"`,
    alignItems: 'center',
    gridColumnGap: theme.spacing(4),

    '&:hover': {
      background: theme.palette.action.hover,
    },
  },
  name: {
    gridArea: 'name',
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
  },
  budget: { gridArea: 'budget' },
  outcome: { gridArea: 'outcome' },
  available: { gridArea: 'available' },
  warning: {
    transform: 'translateY(4px)',
    marginRight: theme.spacing(0.5),
  },
}))

export function TagRow(props) {
  const {
    id,
    symbol,
    name,
    budgeted,
    outcome,
    available,
    colorRGB,
    isChild,
    goal,

    hasOverspent,
    setBudget,
    date,
    onSelect,
  } = props
  const c = useStyles({ isChild })
  const [anchorEl, setAnchorEl] = React.useState(null)
  const showBudget = isChild ? !!budgeted : true

  const handleBudgetChange = amount => {
    setAnchorEl(null)
    if (amount !== budgeted) setBudget(amount, date, id)
  }

  const availableColor = getAvailableColor(
    available,
    hasOverspent,
    isChild,
    !!budgeted
  )
  const hasInnerOverspent = isChild && hasOverspent && available >= 0

  return (
    <div className={c.row}>
      <div className={c.name}>
        <EmojiIcon symbol={symbol} mr={1.5} color={colorRGB} flexShrink={0} />
        <Typography variant="body1" color="textPrimary" noWrap>
          {name}
        </Typography>
      </div>

      {showBudget ? (
        <Box
          color={budgeted ? 'text.primary' : 'text.hint'}
          className={c.budget}
          clone
        >
          <Link
            variant="body1"
            align="right"
            component="button"
            onClick={e => setAnchorEl(e.currentTarget)}
          >
            {formatMoney(budgeted)}
          </Link>
        </Box>
      ) : (
        <Box display="flex" justifyContent="flex-end" className={c.budget}>
          <Tooltip title="Добавить бюджет">
            <IconButton
              size="small"
              edge="end"
              children={<AddIcon />}
              onClick={e => setAnchorEl(e.currentTarget)}
            />
          </Tooltip>
        </Box>
      )}

      <BudgetPopover
        key={`${id}${budgeted}`}
        budgeted={budgeted}
        available={available}
        prevBudgeted={0}
        anchorEl={anchorEl}
        goal={goal}
        needForGoal={goal && goal.amount}
        open={!!anchorEl}
        onChange={handleBudgetChange}
      />

      <Box
        color={outcome ? 'text.primary' : 'text.hint'}
        className={c.outcome}
        clone
      >
        <Typography variant="body1" align="right" onClick={() => onSelect(id)}>
          {formatMoney(outcome ? -outcome : 0)}
        </Typography>
      </Box>

      <Box color={availableColor} className={c.available}>
        <Typography variant="body1" align="right">
          {hasInnerOverspent && (
            <WarningIcon color="error" fontSize="small" className={c.warning} />
          )}
          {formatMoney(available)}
        </Typography>
      </Box>
    </div>
  )
}

// helpers
function getAvailableColor(available, hasOverspent, isChild, hasBudget) {
  const colors = {
    positive: 'success.main',
    negative: 'error.main',
    neutral: 'text.hint',
  }

  if (!isChild || hasBudget) {
    return available === 0
      ? colors.neutral
      : available < 0
      ? colors.negative
      : colors.positive
  } else {
    return available > 0
      ? colors.positive
      : available === 0
      ? colors.neutral
      : hasOverspent
      ? colors.negative
      : colors.neutral
  }
}
