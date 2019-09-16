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
    left: -8,
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
    // outcome,
    // available,
    setBudget,
    date,
  } = props
  const [expanded, setExpanded] = React.useState(false)
  const toggle = () => setExpanded(!expanded)
  const hasChildren = Boolean(children && children.length)
  const c = useStyles({ expanded })

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
      </ExpansionPanelSummary>
      <ExpansionPanelDetails className={c.summaryDetails}>
        {hasChildren &&
          children.map(child => (
            <TagRow
              key={child.id}
              isChild={true}
              {...child}
              {...{ setBudget, date }}
            ></TagRow>
          ))}
      </ExpansionPanelDetails>
    </ExpansionPanel>
  )
}
