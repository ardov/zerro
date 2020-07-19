import React from 'react'
import { useSelector } from 'react-redux'
import { Collapse, Box, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import ArrowRightIcon from '@material-ui/icons/ArrowRight'
import { TagRow } from './TagRow'
import { getAmountsForTag } from 'scenes/Budgets/selectors/getAmountsByTag'
import { getPopulatedTag } from 'store/localData/tags'

export const useStyles = makeStyles(theme => ({
  panelRoot: {
    position: 'relative',
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': { border: 0 },
  },
  expandIcon: {
    position: 'absolute',
    left: 0,
    top: 9,
    transform: props => (props.expanded ? 'rotate(90deg)' : 'rotate(0deg)'),
    transition: '.3s',
  },
}))

export function TagGroup(props) {
  const {
    id,
    metric,
    date,

    openTransactionsPopover,
    openBudgetPopover,
    openGoalPopover,
    openDetails,
    onClick,
  } = props

  const tag = useSelector(state => getPopulatedTag(state, id))
  const amounts = useSelector(state => getAmountsForTag(state)(date, id))

  const {
    totalAvailable,
    totalOutcome,
    outcome,
    available,
    childrenAvailable,
  } = amounts

  let hiddenOverspend = 0
  if (totalAvailable >= 0 && available < 0) hiddenOverspend = -available

  const [expanded, setExpanded] = React.useState(childrenAvailable > 0)
  const toggle = () => setExpanded(expanded => !expanded)

  const hasChildren = !!tag?.children?.length
  const c = useStyles({ expanded })

  const rowProps = {
    date,
    metric,
    openGoalPopover,
    openBudgetPopover,
    openTransactionsPopover,
    openDetails,
  }

  if (!tag.showOutcome && !totalOutcome && !totalAvailable) return null

  return (
    <div className={c.panelRoot} onDoubleClick={onClick}>
      {hasChildren && (
        <IconButton size="small" className={c.expandIcon} onClick={toggle}>
          <ArrowRightIcon />
        </IconButton>
      )}

      <TagRow id={tag.id} {...rowProps} hiddenOverspend={hiddenOverspend} />

      {hasChildren && (
        <Collapse in={expanded}>
          {expanded && (
            <Box pb={1}>
              {!!outcome && <TagRow id={tag.id} isChild {...rowProps} />}

              {tag.children.map(id => (
                <TagRow key={id} id={id} isChild {...rowProps} />
              ))}
            </Box>
          )}
        </Collapse>
      )}
    </div>
  )
}
