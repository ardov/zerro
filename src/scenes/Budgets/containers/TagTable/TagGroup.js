import React, { useContext } from 'react'
import { useSelector } from 'react-redux'
import getMonth from 'date-fns/getMonth'
import getDaysInMonth from 'date-fns/getDaysInMonth'
import getDate from 'date-fns/getDate'
import { Collapse, Box, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import DragIndicatorIcon from '@material-ui/icons/DragIndicator'
import { TagRow } from './TagRow'
import { getAmountsForTag } from 'scenes/Budgets/selectors/getAmountsByTag'
import { getPopulatedTag } from 'store/localData/tags'
import { useMonth } from 'scenes/Budgets/useMonth'
import { DragModeContext } from '../DnDContext'

export const useStyles = makeStyles(theme => ({
  panelRoot: {
    position: 'relative',
    background: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': { border: 0 },
  },
  dragIcon: {
    position: 'absolute',
    left: 4,
    top: 13,
  },
  expandIcon: {
    position: 'absolute',
    left: 0,
    top: 12,
    transform: props => (props.expanded ? 'rotate(90deg)' : 'rotate(0deg)'),
    transition: '.3s',
  },
}))

export const TagGroup = React.forwardRef((props, ref) => {
  const {
    id,
    metric,
    children,
    openTransactionsPopover,
    openBudgetPopover,
    openGoalPopover,
    openDetails,
    ...rest
  } = props

  const [month] = useMonth()
  const tag = useSelector(state => getPopulatedTag(state, id))
  const amounts = useSelector(state => getAmountsForTag(state)(month, id))
  const { dragMode } = useContext(DragModeContext)

  const {
    totalAvailable,
    totalOutcome,
    totalBudgeted,
    outcome,
    available,
    childrenAvailable,
  } = amounts

  let hiddenOverspend = 0
  if (totalAvailable >= 0 && available < 0) hiddenOverspend = -available

  const [expanded, setExpanded] = React.useState(childrenAvailable > 0)
  const toggle = () => setExpanded(expanded => !expanded)

  const hasChildren = !!children?.length
  const c = useStyles({ expanded })

  const isVisible =
    tag.showOutcome ||
    totalBudgeted ||
    totalOutcome ||
    totalAvailable ||
    dragMode === 'REORDER'

  if (!isVisible) return null

  const currDate = Date.now()
  const currMonthIndex = getMonth(currDate)
  const monthIndex = getMonth(month)
  const showOverspend = currMonthIndex === monthIndex

  const rowProps = {
    date: month,
    showOverspend,
    daysInMonth: showOverspend && getDaysInMonth(currDate),
    currDay: showOverspend && getDate(currDate),
    metric,
    openGoalPopover,
    openBudgetPopover,
    openTransactionsPopover,
    openDetails,
  }

  return (
    <div className={c.panelRoot} ref={ref} {...rest}>
      {dragMode === 'REORDER' && (
        <DragIndicatorIcon
          fontSize="small"
          color="action"
          className={c.dragIcon}
        />
      )}
      {hasChildren && dragMode !== 'REORDER' && (
        <IconButton size="small" className={c.expandIcon} onClick={toggle}>
          <ChevronRightIcon fontSize="inherit" />
        </IconButton>
      )}
      <TagRow id={tag.id} {...rowProps} hiddenOverspend={hiddenOverspend} />

      {hasChildren && dragMode !== 'REORDER' && (
        <Collapse in={expanded} unmountOnExit>
          <Box pb={1}>
            {!!outcome && <TagRow id={tag.id} isChild {...rowProps} />}
            {children.map(({ id }) => (
              <TagRow key={id} id={id} isChild {...rowProps} />
            ))}
          </Box>
        </Collapse>
      )}
    </div>
  )
})
