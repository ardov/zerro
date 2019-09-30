import React from 'react'
import { Typography } from '@material-ui/core'
import { Budgeted } from './Budgeted'
import { Outcome } from './Outcome'
import { Available } from './Available'
import { makeStyles } from '@material-ui/styles'
import EmojiIcon from 'components/EmojiIcon'

export const useStyles = makeStyles(theme => ({
  row: {
    paddingTop: ({ isChild }) => theme.spacing(isChild ? 0.5 : 1),
    paddingBottom: props => theme.spacing(props.isChild ? 0.5 : 1),
    paddingLeft: props => theme.spacing(props.isChild ? 7 : 2),
    paddingRight: theme.spacing(2),
    display: 'grid',
    width: '100%',
    gridTemplateColumns: 'auto 96px 96px 96px',
    alignItems: 'center',
    gridColumnGap: theme.spacing(3),
    '&:hover': {
      background: theme.palette.action.hover,
    },
  },
  name: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
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
    setBudget,
    date,
  } = props
  const c = useStyles({ isChild })
  const onBudgetChange = amount => setBudget(amount, date, id)

  return (
    <div className={c.row}>
      <div className={c.name}>
        <EmojiIcon symbol={symbol} mr={1.5} flexShrink={0} />
        <Typography variant="body1" color="textPrimary" noWrap>
          {name}
        </Typography>
      </div>

      <Budgeted value={budgeted} onChange={onBudgetChange} />
      <Outcome value={outcome} />
      <Available value={available} />
    </div>
  )
}
