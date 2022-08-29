import React, { FC, useCallback, useState } from 'react'
import { Paper, Typography } from '@mui/material'
import { TEnvelopeId, TISOMonth } from '@shared/types'
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
import { useSearchParam } from '@shared/hooks/useSearchParam'

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
  const [, setId] = useSearchParam<TEnvelopeId>('transactions')
  const onOpenTransactionPopover = useCallback(
    (id: TEnvelopeId) => {
      console.log(id)
      setId(id)
    },
    [setId]
  )
  return (
    <>
      <Paper className={className}>
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
                    openTransactionsPopover={onOpenTransactionPopover}
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
                    openTransactionsPopover={onOpenTransactionPopover}
                    openDetails={onOpenDetails}
                  />
                ))}
              />
            ))}
          </EnvelopeGroup>
        ))}
      </Paper>
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
    <>
      <Typography
        variant="h6"
        sx={{
          pl: 3,
          pb: 1,
          pt: 2,
          borderBottom: `1px solid black`,
          borderColor: 'divider',
          '&:last-child': { border: 0 },
        }}
      >
        {group.name}
      </Typography>
      {children}
    </>
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
