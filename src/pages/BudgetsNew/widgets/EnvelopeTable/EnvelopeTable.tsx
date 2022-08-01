import React, { FC, useState } from 'react'
import { Paper, Stack, Typography } from '@mui/material'
import { TEnvelopeId, TISOMonth } from 'shared/types'
import {
  TGroupInfo,
  useEnvelopeGroups,
  useExpandEnvelopes,
  useMonth,
} from '../../model'
import { Parent } from './Parent'
import { Row } from './Row'
import { BudgetPopover } from '../BudgetPopover'
import { GoalPopover } from '../GoalPopover'

type TagTableProps = {
  onOpenDetails: (id: TEnvelopeId) => void
  className?: string
  // sx?: BoxProps['sx']
}

export const EnvelopeTable: FC<TagTableProps> = props => {
  const { onOpenDetails, className } = props
  const [month] = useMonth()
  const groups = useEnvelopeGroups(month)
  const { expanded, toggle, expandAll, collapseAll } = useExpandEnvelopes()
  const budget = useEnvelopePopover(month, 'budget')
  const goal = useEnvelopePopover(month, 'goal')
  return (
    <>
      <Stack spacing={2} className={className}>
        {groups.map(group => (
          <EnvelopeGroup key={group.name} group={group}>
            {group.children.map(parent => (
              <Parent
                key={parent.id}
                id={parent.id}
                isVisible={parent.isDefaultVisible}
                isExpanded={expanded.includes(parent.id)}
                onExpandToggle={toggle}
                onExpandAll={expandAll}
                onCollapseAll={collapseAll}
                parent={
                  <Row
                    envelope={parent}
                    metric="available"
                    openGoalPopover={goal.onOpen}
                    openBudgetPopover={budget.onOpen}
                    openTransactionsPopover={() => {}}
                    openDetails={onOpenDetails}
                  />
                }
                children={parent.children.map(child => (
                  <Row
                    key={'child' + child.id}
                    envelope={child}
                    metric="available"
                    openGoalPopover={goal.onOpen}
                    openBudgetPopover={budget.onOpen}
                    openTransactionsPopover={() => {}}
                    openDetails={onOpenDetails}
                  />
                ))}
              />
            ))}
          </EnvelopeGroup>
        ))}
      </Stack>
      {budget.props.id && (
        <BudgetPopover {...budget.props} id={budget.props.id} />
      )}
      {goal.props.id && <GoalPopover {...goal.props} id={goal.props.id} />}
    </>
  )
}

type TEnvelopeGroupProps = {
  group: TGroupInfo
  children?: React.ReactNode[]
}

const EnvelopeGroup: FC<TEnvelopeGroupProps> = ({ group, children }) => {
  return (
    <Paper sx={{ position: 'relative', py: 1 }}>
      <Typography variant="h6" sx={{ pl: 3 }}>
        {group.name}
      </Typography>
      {children}
    </Paper>
  )
}

function useEnvelopePopover(month: TISOMonth, name = '') {
  const [anchorEl, setAnchorEl] = useState<Element>()
  const [id, setId] = useState<TEnvelopeId>()
  const open = !!anchorEl
  const onOpen = (id: TEnvelopeId, anchor: Element) => {
    setAnchorEl(anchor)
    setId(id)
  }

  const props = {
    key: name + id + month,
    id,
    month,
    open,
    anchorEl,
    onClose: () => {
      setAnchorEl(undefined)
    },
  }
  return { props, onOpen }
}
