import React from 'react'
import {
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import IconButton from '@material-ui/core/IconButton'
import ArrowRightIcon from '@material-ui/icons/ArrowRight'
import { TagRow } from './TagRow'

export const useStyles = makeStyles(theme => ({
  panelRoot: {
    padding: 0,
    borderTop: '1px solid',
    borderColor: theme.palette.divider,
    '&$expanded': { margin: 0 },
    '&:before': { opacity: 0 },
  },
  summaryRoot: {
    padding: 0,
    minHeight: 0,
    '&$expanded': {
      minHeight: 0,
    },
  },
  summaryContent: {
    margin: 0,
    '&$expanded': {
      margin: 0,
    },
  },
  summaryDetails: {
    flexDirection: 'column',
    padding: theme.spacing(0, 0, 1),
  },
  expanded: {},

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
    outcome,
    // available,
    setBudget,
    date,
  } = props
  const [expanded, setExpanded] = React.useState(false)
  const toggle = () => setExpanded(!expanded)
  const hasChildren = Boolean(children && children.length)
  const c = useStyles({ expanded })

  const hasOverspent = !!overspent

  return (
    <ExpansionPanel
      classes={{ root: c.panelRoot, expanded: c.expanded }}
      elevation={0}
      expanded={expanded}
    >
      <ExpansionPanelSummary
        classes={{
          root: c.summaryRoot,
          content: c.summaryContent,
          expanded: c.expanded,
        }}
      >
        {hasChildren && (
          <IconButton size="small" className={c.expandIcon} onClick={toggle}>
            <ArrowRightIcon />
          </IconButton>
        )}
        <TagRow
          {...{
            id,
            symbol,
            name,
            budgeted: totalBudgeted,
            outcome: totalOutcome,
            available: totalAvailable,
            hasOverspent,
            setBudget,
            date,
          }}
        />
      </ExpansionPanelSummary>
      <ExpansionPanelDetails className={c.summaryDetails}>
        {hasChildren &&
          getChildrenData({
            children,
            parentOutcome: outcome,
            date,
            setBudget,
            hasOverspent,
          }).map(data => <TagRow key={data.id} {...data} />)}
      </ExpansionPanelDetails>
    </ExpansionPanel>
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
