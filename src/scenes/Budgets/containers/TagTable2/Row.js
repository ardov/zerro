import React from 'react'
import { makeStyles } from '@material-ui/styles'
import IconButton from '@material-ui/core/IconButton'
import ArrowRightIcon from '@material-ui/icons/ArrowRight'
import { TagRow } from './TagRow'

export const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(0.5, 1),
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
    display: 'flex',
    alignItems: 'flex-start',
    '&:hover': {
      background: '#fafafa',
    },
  },
  tags: {
    display: 'grid',
    flexGrow: 1,
  },
  expander: props => ({
    opacity: props.hasChildren ? 1 : 0,
    transform: props.expanded ? 'rotate(90deg)' : 'rotate(0deg)',
    transition: '.3s',
  }),
}))

export default function Row(props) {
  const {
    id,
    showOutcome,
    symbol,
    name,
    overspent,
    totalBudgeted,
    totalAvailable,
    totalOutcome,
    children,
    // budgeted,
    // outcome,
    // available,
    setBudget,
    date,
  } = props

  const hasChildren = children && children.length
  const [expanded, setExpanded] = React.useState(false)
  const c = useStyles({ hasChildren, expanded })
  const toggleExpanded = () => setExpanded(!expanded)

  return (
    <div className={c.root}>
      <IconButton onClick={toggleExpanded} size="small">
        <ArrowRightIcon className={c.expander} />
      </IconButton>
      <div className={c.tags}>
        <TagRow
          {...{
            id,
            showOutcome,
            symbol,
            name,
            overspent,
            budgeted: totalBudgeted,
            outcome: totalOutcome,
            available: totalAvailable,
            setBudget,
            date,
          }}
        />
        {expanded &&
          hasChildren &&
          children.map(child => (
            <TagRow
              key={child.id}
              isChild={true}
              {...child}
              {...{ setBudget, date }}
            ></TagRow>
          ))}
      </div>
    </div>
  )
}
