import React, { useContext } from 'react'
import { useSelector } from 'react-redux'
import { Collapse, Box, IconButton } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { ChevronRightIcon, DragIndicatorIcon } from 'components/Icons'
import { TagRow } from './TagRow'
import { getAmountsById } from 'scenes/Budgets/selectors'
import { useMonth } from 'scenes/Budgets/pathHooks'
import { DragModeContext } from '../DnDContext'

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
    transform: (p: any) => (p.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'),
    transition: '.3s',
  },
}))

type TagGroupProps = {
  id: string
  metric: 'available' | 'budgeted' | 'outcome'
  isVisible: boolean
  isExpanded: boolean
  tagChildren: PopulatedTag[]
  onExpand: (id: string, state: boolean) => void
  onExpandAll: (state: boolean) => void
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
      isVisible,
      isExpanded,
      onExpand,
      onExpandAll,
      openTransactionsPopover,
      openBudgetPopover,
      openGoalPopover,
      openDetails,
      ...rest
    } = props

    const [month] = useMonth()
    const amounts = useSelector(getAmountsById)?.[month]?.[id] || {}
    const { dragMode } = useContext(DragModeContext)

    const { totalAvailable, outcome, available } = amounts

    let hiddenOverspend = 0
    if (totalAvailable >= 0 && available < 0) hiddenOverspend = -available

    const hasChildren = !!tagChildren?.length
    const c = useStyles({ isExpanded })

    const rowProps = {
      date: month,
      metric,
      openGoalPopover,
      openBudgetPopover,
      openTransactionsPopover,
      openDetails,
    }

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
          <IconButton
            size="small"
            className={c.expandIcon}
            onClick={e => {
              if (e.altKey) onExpandAll(!isExpanded)
              else onExpand(id, !isExpanded)
            }}
          >
            <ChevronRightIcon fontSize="inherit" />
          </IconButton>
        )}
        <TagRow id={id} {...rowProps} hiddenOverspend={hiddenOverspend} />

        {hasChildren && dragMode !== 'REORDER' && (
          <Collapse in={isExpanded} unmountOnExit>
            <Box pb={1}>
              {!!outcome && <TagRow id={id} isChild {...rowProps} />}
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
