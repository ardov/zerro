import React from 'react'
import { Collapse, Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import IconButton from '@material-ui/core/IconButton'
import ArrowRightIcon from '@material-ui/icons/ArrowRight'
import { TagRow } from './TagRow'

export const useStyles = makeStyles(theme => ({
  panelRoot: {
    position: 'relative',
    borderTop: '1px solid',
    borderColor: theme.palette.divider,
  },

  expandIcon: {
    position: 'absolute',
    left: 0,
    top: 9,
    transform: props => (props.expanded ? 'rotate(90deg)' : 'rotate(0deg)'),
    transition: '.3s',
  },
}))

export default function Row(props) {
  const {
    metric,
    goals,

    id,
    // showOutcome,
    symbol,
    colorRGB,
    name,
    overspent,
    totalBudgeted,
    totalAvailable,
    totalOutcome,
    children,
    // budgeted,
    outcome,
    // available,
    setBudget,
    date,
    onSelect,
  } = props
  const [expanded, setExpanded] = React.useState(false)
  const toggle = () => setExpanded(!expanded)
  const hasChildren = Boolean(children && children.length)
  const c = useStyles({ expanded })

  const hasOverspent = !!overspent

  return (
    <div className={c.panelRoot}>
      {hasChildren && (
        <IconButton size="small" className={c.expandIcon} onClick={toggle}>
          <ArrowRightIcon />
        </IconButton>
      )}

      <TagRow
        {...{
          metric,
          id,
          symbol,
          colorRGB,
          name,
          goal: goals[id],
          budgeted: totalBudgeted,
          outcome: totalOutcome,
          available: totalAvailable,
          hasOverspent,
          setBudget,
          date,
          onSelect,
        }}
      />

      {hasChildren && (
        <Collapse in={expanded}>
          <Box pb={1}>
            {getChildrenData({
              children,
              parentOutcome: outcome,
              date,
              setBudget,
              hasOverspent,
            }).map(data => (
              <TagRow
                key={data.id}
                isHidden={!expanded}
                {...data}
                goal={goals[data.id]}
                metric={metric}
                onSelect={onSelect}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </div>
  )
}

function getChildrenData({
  children,
  parentOutcome,
  date,
  setBudget,
  hasOverspent,
}) {
  const childrenData = children.length
    ? children
        .filter(
          child =>
            child.showOutcome || child.totalOutcome || child.totalAvailable
        )
        .map(child => ({
          isChild: true,
          id: child.id,
          symbol: child.symbol,
          name: child.name,
          goal: child.goal,
          budgeted: child.budgeted,
          outcome: child.outcome,
          available: child.available,
          hasOverspent,
          setBudget,
          date,
        }))
    : null

  const additionalRows =
    childrenData && parentOutcome
      ? [
          {
            isChild: true,
            id: 'unsorted',
            symbol: '-',
            name: 'Без подкатегории',
            budgeted: 0,
            outcome: parentOutcome,
            available: 0,
            hasOverspent,
            setBudget,
            date,
          },
        ]
      : []

  return [...additionalRows, ...childrenData]
}
