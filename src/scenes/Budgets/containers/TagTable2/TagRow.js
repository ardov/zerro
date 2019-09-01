import React from 'react'
import Typography from '@material-ui/core/Typography'
import { Budgeted } from './Budgeted'
import { Outcome } from './Outcome'
import { Available } from './Available'
import { makeStyles } from '@material-ui/styles'

export const useStyles = makeStyles(theme => ({
  row: {
    padding: '4px 0',
    display: 'grid',
    gridTemplateColumns: 'auto 96px 96px 96px',
    alignItems: 'center',
    gridColumnGap: 16,
    '&:hover': {
      background: 'rgba(0,0,0,.04)',
    },
  },
  symbol: {
    display: 'inline-flex',
    flexShrink: 0,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: '50%',
    marginRight: 12,
    textAlign: 'center',
  },
  emoji: { fontSize: '4em', transform: 'scale(.25)', color: '#000' },
  name: props => ({
    paddingLeft: props.isChild ? 40 : 0,
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
  }),
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
        <div className={c.symbol}>
          <div className={c.emoji}>{symbol}</div>
        </div>
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
