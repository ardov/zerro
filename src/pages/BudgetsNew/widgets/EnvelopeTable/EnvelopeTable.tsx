import React, { FC, useState } from 'react'
import { BoxProps, Paper, Stack, Typography } from '@mui/material'
import {
  TGroupInfo,
  useEnvelopeGroups,
  useExpandEnvelopes,
  useMonth,
} from '../../model'
import { Parent } from './Parent'
import { Row } from './Row'
import { BudgetPopover } from '../BudgetPopover'
import { TEnvelopeId } from 'models/shared/envelopeHelpers'
import { TISOMonth } from 'shared/types'

type TagTableProps = {
  openDetails: (id: string) => void
  onOpenMonthDrawer: () => void
  sx?: BoxProps['sx']
  className: string
}

export const EnvelopeTable: FC<TagTableProps> = props => {
  const [month] = useMonth()
  const groups = useEnvelopeGroups(month)
  const { expanded, toggle, expandAll, collapseAll } = useExpandEnvelopes()
  const budget = useEnvelopePopover(month)
  return (
    <>
      <Stack spacing={2} className={props.className}>
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
                    openGoalPopover={() => {}}
                    openBudgetPopover={budget.onOpen}
                    openTransactionsPopover={() => {}}
                    openDetails={() => {}}
                  />
                }
                children={parent.children.map(child => (
                  <Row
                    key={child.id}
                    envelope={child}
                    metric="available"
                    openGoalPopover={() => {}}
                    openBudgetPopover={budget.onOpen}
                    openTransactionsPopover={() => {}}
                    openDetails={() => {}}
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

function useEnvelopePopover(month: TISOMonth) {
  const [anchorEl, setAnchorEl] = useState<Element>()
  const [id, setId] = useState<TEnvelopeId>()
  const open = !!anchorEl
  const onOpen = (id: TEnvelopeId, anchor: Element) => {
    setAnchorEl(anchor)
    setId(id)
  }

  const props = {
    key: id + month,
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
