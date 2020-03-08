import React from 'react'
import { connect } from 'react-redux'
import { Collapse, Box, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import ArrowRightIcon from '@material-ui/icons/ArrowRight'
import { TagRow } from './TagRow'
import { getGoals } from 'store/localData/hiddenData'
import { getTagsTree } from 'store/localData/tags'
import { getAmountsForTag } from 'scenes/Budgets/selectors/getAmountsByTag'

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

function TagGroup(props) {
  const {
    id,
    metric,
    date,
    showAll,

    tag,
    goals,
    amounts,

    openTransactionsPopover,
    openBudgetPopover,
    openGoalPopover,
  } = props

  const {
    totalBudgeted,
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
  }

  if (!tag.showOutcome && !totalOutcome && !totalAvailable && !showAll)
    return null

  return (
    <div className={c.panelRoot}>
      {hasChildren && (
        <IconButton size="small" className={c.expandIcon} onClick={toggle}>
          <ArrowRightIcon />
        </IconButton>
      )}

      <TagRow
        {...withoutChildren(tag)}
        {...rowProps}
        goal={goals[id]}
        budgeted={totalBudgeted}
        outcome={totalOutcome}
        available={totalAvailable}
        hiddenOverspend={hiddenOverspend}
      />

      {hasChildren && (
        <Collapse in={expanded}>
          {expanded && (
            <Box pb={1}>
              {!!outcome && (
                <TagRow
                  id="unsorted"
                  name="Без подкатегории"
                  symbol="-"
                  isChild={true}
                  outcome={outcome}
                  {...rowProps}
                />
              )}

              {tag.children.map(child => (
                <TagRow
                  key={child.id}
                  {...withoutChildren(child)}
                  {...rowProps}
                  isChild={true}
                  goal={goals[child.id]}
                  budgeted={amounts.children[child.id].budgeted}
                  outcome={amounts.children[child.id].outcome}
                  available={amounts.children[child.id].available}
                />
              ))}
            </Box>
          )}
        </Collapse>
      )}
    </div>
  )
}

function withoutChildren(tag) {
  const newTag = { ...tag }
  delete newTag.children
  return newTag
}

const mapStateToProps = (state, { id, date }) => ({
  goals: getGoals(state),
  tag: getTagsTree(state).find(tag => tag.id === id),
  amounts: getAmountsForTag(state)(date, id),
})

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(TagGroup)
