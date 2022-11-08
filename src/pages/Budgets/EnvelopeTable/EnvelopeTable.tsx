import React, { FC, memo } from 'react'
import { Paper, Typography } from '@mui/material'
import { TEnvelopeId, TISOMonth } from '@shared/types'
import { Parent } from './Parent'
import { Row } from './Row/Row'
import { Header } from './Header'
import { rowStyle } from './shared/shared'
import { trMode } from '../TransactionsDrawer'
import { useMetric } from './models/useMetric'
import { useEnvelopeGroups } from './models/envelopeGroups'
import { useExpandEnvelopes } from './models/useExpandEnvelopes'
import { TGroupInfo } from './models/getEnvelopeGroups'
import { useToggle } from '@shared/hooks/useToggle'
import { Highlight } from './Highlight'
import { shallowEqual } from 'react-redux'

type TagTableProps = {
  month: TISOMonth
  className?: string
  onOpenDetails: (id: TEnvelopeId) => void
  onOpenOverview: () => void
  onShowTransactions: (
    id: TEnvelopeId | null,
    opts?:
      | {
          mode?: trMode | undefined
          isExact?: boolean | undefined
        }
      | undefined
  ) => void
}

const EnvelopeTable2: FC<TagTableProps> = props => {
  const {
    month,
    className,
    onOpenDetails,
    onOpenOverview,
    onShowTransactions,
  } = props
  const groups = useEnvelopeGroups(month)
  const { expanded, toggle, expandAll, collapseAll } = useExpandEnvelopes()
  const { metric, toggleMetric } = useMetric()
  const [showAll, toggleShowAll] = useToggle()
  const [reorderMode, toggleReorderMode] = useToggle()

  const renderGroups = groups.map(group => {
    const parents = group.children
      .filter(parent => showAll || parent.isDefaultVisible)
      .map(parent => {
        const isExpanded = expanded.includes(parent.id)
        const children = parent.children
          .filter(parent => showAll || parent.isDefaultVisible)
          .map((child, idx, arr) => (
            <Row
              key={'child' + child.id}
              envelope={child}
              metric={metric}
              openTransactionsPopover={() =>
                onShowTransactions(child.id, { isExact: true })
              }
              openDetails={onOpenDetails}
              isLastVisibleChild={idx === arr.length - 1}
              isReordering={reorderMode}
            />
          ))

        return (
          <Parent
            key={parent.id}
            id={parent.id}
            isExpanded={isExpanded}
            onExpandToggle={toggle}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
            parent={
              <Row
                envelope={parent}
                metric={metric}
                openTransactionsPopover={onShowTransactions}
                openDetails={onOpenDetails}
                isExpanded={isExpanded}
                isReordering={reorderMode}
              />
            }
            children={children}
          />
        )
      })
    if (!parents.length) return null
    return (
      <EnvelopeGroup key={group.name} group={group}>
        {parents}
      </EnvelopeGroup>
    )
  })

  return (
    <>
      <Paper className={className} sx={{ position: 'relative' }}>
        <Header
          month={month}
          metric={metric}
          isAllShown={showAll}
          isReordering={reorderMode}
          onShowAllToggle={toggleShowAll}
          onReorderModeToggle={toggleReorderMode}
          onMetricSwitch={toggleMetric}
          onOpenOverview={onOpenOverview}
        />
        {renderGroups}
      </Paper>
      <Highlight />
    </>
  )
}

export const EnvelopeTable = memo(
  (props: TagTableProps) => <EnvelopeTable2 {...props} />,
  shallowEqual
)

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
          fontWeight: 900,
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
