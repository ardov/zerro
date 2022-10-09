import React, { FC } from 'react'
import { Paper, Typography } from '@mui/material'
import { TEnvelopeId } from '@shared/types'
import { useMonth } from '@shared/hooks/useMonth'
import { Parent } from './Parent'
import { Row } from './Row/Row'
import { Header } from './Header'
import { rowStyle } from './shared/shared'
import { useTrDrawer } from '../TransactionsDrawer'
import { useMetric } from './models/useMetric'
import { useEnvelopeGroups } from './models/envelopeGroups'
import { useExpandEnvelopes } from './models/useExpandEnvelopes'
import { TGroupInfo } from './models/getEnvelopeGroups'
import { useToggle } from '@shared/hooks/useToggle'
import { Highlight } from './Highlight'

type TagTableProps = {
  onOpenDetails: (id: TEnvelopeId) => void
  onOpenOverview: () => void
  className?: string
}

export const EnvelopeTable: FC<TagTableProps> = props => {
  const { onOpenDetails, className, onOpenOverview } = props
  const { setDrawer } = useTrDrawer()
  const [month] = useMonth()
  const groups = useEnvelopeGroups(month)
  const { expanded, toggle, expandAll, collapseAll } = useExpandEnvelopes()
  const { metric, toggleMetric } = useMetric()
  const [showAll, toggleShowAll] = useToggle()
  const [reorderMode, toggleReorderMode] = useToggle()

  const renderGroups = groups.map(group => {
    const parents = group.children
      .filter(parent => showAll || parent.isDefaultVisible)
      .map(parent => {
        const children = parent.children
          .filter(parent => showAll || parent.isDefaultVisible)
          .map(child => (
            <Row
              key={'child' + child.id}
              envelope={child}
              metric={metric}
              openTransactionsPopover={() =>
                setDrawer(child.id, { isExact: true })
              }
              openDetails={onOpenDetails}
              isBottom={false}
              isReordering={reorderMode}
            />
          ))

        return (
          <Parent
            key={parent.id}
            id={parent.id}
            isExpanded={expanded.includes(parent.id)}
            onExpandToggle={toggle}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
            parent={
              <Row
                envelope={parent}
                metric={metric}
                openTransactionsPopover={setDrawer}
                openDetails={onOpenDetails}
                isBottom={false}
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
      {reorderMode && <Highlight />}
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
