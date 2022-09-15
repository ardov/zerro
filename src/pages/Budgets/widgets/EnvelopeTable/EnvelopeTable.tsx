import React, { FC, useState } from 'react'
import { Paper, Typography } from '@mui/material'
import { TEnvelopeId } from '@shared/types'
import { useEnvelopePopover } from '@shared/hooks/useEnvelopePopover'
import {
  TGroupInfo,
  useEnvelopeGroups,
  useExpandEnvelopes,
  useMonth,
} from '../../model'
import { Parent } from './Parent'
import { Row } from './Row/Row'
import { BudgetPopover } from '../BudgetPopover'
import { GoalPopover } from '../GoalPopover'
import { Header } from './Header'
import { Metric, rowStyle } from './shared/shared'
import { useTrDrawer } from '../TransactionsDrawer'

type TagTableProps = {
  onOpenDetails: (id: TEnvelopeId) => void
  className?: string
}

export const EnvelopeTable: FC<TagTableProps> = props => {
  const { setDrawer } = useTrDrawer()
  const { onOpenDetails, className } = props
  const [month] = useMonth()
  const groups = useEnvelopeGroups(month)
  const { expanded, toggle, expandAll, collapseAll } = useExpandEnvelopes()
  const budget = useEnvelopePopover(month, 'budget')
  const goal = useEnvelopePopover(month, 'goal')
  const [metric, setMetric] = useState<Metric>(Metric.available)
  const switchMetric = () => {
    // TODO
  }

  return (
    <>
      <Paper className={className}>
        <Header metric={metric} onMetricSwitch={switchMetric} />
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
                    metric={metric}
                    openGoalPopover={goal.onOpen}
                    openBudgetPopover={budget.onOpen}
                    openTransactionsPopover={setDrawer}
                    openDetails={onOpenDetails}
                  />
                }
                children={parent.children.map(child => (
                  <Row
                    key={'child' + child.id}
                    envelope={child}
                    metric={metric}
                    openGoalPopover={goal.onOpen}
                    openBudgetPopover={budget.onOpen}
                    openTransactionsPopover={() =>
                      setDrawer(child.id, { isExact: true })
                    }
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
          ...rowStyle,
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
