import React, { FC } from 'react'
import { BoxProps, Paper, Stack } from '@mui/material'
import {
  TGroupInfo,
  useEnvelopeGroups,
  useExpandEnvelopes,
  useMonth,
} from '../../model'
import { Parent } from './Parent'
import { Row } from './Row'

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
  return (
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
                  openBudgetPopover={() => {}}
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
                  openBudgetPopover={() => {}}
                  openTransactionsPopover={() => {}}
                  openDetails={() => {}}
                />
              ))}
            />
          ))}
        </EnvelopeGroup>
      ))}
    </Stack>
  )
}

type TEnvelopeGroupProps = {
  group: TGroupInfo
  children?: React.ReactNode[]
}

const EnvelopeGroup: FC<TEnvelopeGroupProps> = ({ group, children }) => {
  return (
    <Paper sx={{ position: 'relative', py: 1 }}>
      <div>{group.name}</div>
      {children}
    </Paper>
  )
}
