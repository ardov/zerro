import React, { useContext } from 'react'
import { useSelector } from 'react-redux'
import { Collapse, Box, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import DragIndicatorIcon from '@material-ui/icons/DragIndicator'
import { TagRow } from './TagRow'
import {
  getAmountsById,
  TagGroupAmounts,
} from 'scenes/Budgets/selectors/getAmountsByTag'
import { getPopulatedTag } from 'store/localData/tags'
import { useMonth } from 'scenes/Budgets/pathHooks'
import { DragModeContext } from '../DnDContext'
import { useToggle } from 'helpers/useToggle'
import { PopulatedTag } from 'types'

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
    transform: (p: any) => (p.expanded ? 'rotate(90deg)' : 'rotate(0deg)'),
    transition: '.3s',
  },
}))

type TagGroupProps = {
  id: string
  metric: 'available' | 'budgeted' | 'outcome'
  tagChildren: PopulatedTag[]
  openDetails: (id: string) => void
  openGoalPopover: (id: string, target: Element) => void
  openBudgetPopover: (id: string, target: Element) => void
  openTransactionsPopover: (id: string) => void
}

export const TagGroup = React.forwardRef<HTMLDivElement, TagGroupProps>(
  (props, ref) => {
    const {
      id,
      metric,
      tagChildren,
      openTransactionsPopover,
      openBudgetPopover,
      openGoalPopover,
      openDetails,
      ...rest
    } = props

    const [month] = useMonth()
    const tag = useSelector(state => getPopulatedTag(state, id))
    const amounts = useSelector(getAmountsById)?.[month]?.[id] || {}
    const { dragMode } = useContext(DragModeContext)

    const {
      totalAvailable,
      totalOutcome,
      totalBudgeted,
      outcome,
      available,
      childrenAvailable,
    } = amounts as TagGroupAmounts

    let hiddenOverspend = 0
    if (totalAvailable >= 0 && available < 0) hiddenOverspend = -available

    const [expanded, toggle] = useToggle(childrenAvailable > 0)

    const hasChildren = !!tagChildren?.length
    const c = useStyles({ expanded })

    const rowProps = {
      date: month,
      metric,
      openGoalPopover,
      openBudgetPopover,
      openTransactionsPopover,
      openDetails,
    }

    const isVisible =
      tag.showOutcome ||
      totalBudgeted ||
      totalOutcome ||
      totalAvailable ||
      dragMode === 'REORDER'

    if (!isVisible) return null

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
              {tagChildren.map(({ id }) => (
                <TagRow key={id} id={id} isChild {...rowProps} />
              ))}
            </Box>
          </Collapse>
        )}
      </div>
    )
  }
)
