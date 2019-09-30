import React from 'react'
import { Typography, Box } from '@material-ui/core'
import { Budgeted } from './Budgeted'
import { makeStyles } from '@material-ui/styles'
import EmojiIcon from 'components/EmojiIcon'
import { formatMoney } from 'helpers/format'
import WarningIcon from '@material-ui/icons/Warning'

export const useStyles = makeStyles(theme => ({
  row: {
    paddingTop: ({ isChild }) => theme.spacing(isChild ? 0.5 : 1),
    paddingBottom: props => theme.spacing(props.isChild ? 0.5 : 1),
    paddingLeft: props => theme.spacing(props.isChild ? 9 : 4),
    paddingRight: theme.spacing(2),
    display: 'grid',
    width: '100%',
    gridTemplateColumns: 'auto 120px 120px 120px',
    alignItems: 'center',
    gridColumnGap: theme.spacing(4),
    '&:hover': {
      background: theme.palette.action.hover,
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
    id,
    showOutcome,
    symbol,
    name,
    overspent,
    budgeted,
    outcome,
    available,
    isChild,

    hasOverspent,
    setBudget,
    date,
  } = props
  const c = useStyles({ isChild })
  const onBudgetChange = amount => setBudget(amount, date, id)

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
        <EmojiIcon symbol={symbol} mr={1.5} flexShrink={0} />
        <Typography variant="body1" color="textPrimary" noWrap>
          {name}
        </Typography>
      </div>

      <Budgeted value={budgeted} onChange={onBudgetChange} />

      <Box color={outcome ? 'text.primary' : 'text.hint'} clone>
        <Typography variant="body1" align="right">
          {formatMoney(outcome ? -outcome : 0)}
        </Typography>
      </Box>

      <Box color={availableColor}>
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
