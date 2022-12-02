import React, { FC, memo, useCallback } from 'react'
import { shallowEqual } from 'react-redux'
import { isEqual } from 'lodash'
import { Paper } from '@mui/material'
import { TEnvelopeId, TISOMonth } from '@shared/types'
import { useToggle } from '@shared/hooks/useToggle'

import { useAppSelector } from '@store/index'
import { envelopeModel } from '@entities/envelope'

import { Parent } from './Parent'
import { Row } from './Row'
import { Header } from './Header'
import { trMode } from '../TransactionsDrawer'
import { useMetric } from './models/useMetric'
import { useExpandEnvelopes } from './models/useExpandEnvelopes'
import { Highlight } from './Highlight'
import { useEnvRenderInfo } from './models/envRenderInfo'
import { Footer } from './Footer'
import { Group } from './Group'

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

  const structure = useAppSelector(envelopeModel.getEnvelopeStructure, isEqual)
  const renderInfo = useEnvRenderInfo(month)
  const { expanded, toggle, expandAll, collapseAll } = useExpandEnvelopes()
  const { metric, toggleMetric } = useMetric()
  const [showAll, toggleShowAll] = useToggle()
  const [reorderMode, toggleReorderMode] = useToggle()

  const onShowExactTransactions = useCallback(
    (id: TEnvelopeId) => onShowTransactions(id, { isExact: true }),
    [onShowTransactions]
  )

  const renderGroups = structure
    .map((group, groupIdx) => {
      const parents = group.children
        .filter(parent => showAll || renderInfo[parent.id].isDefaultVisible)
        .map(parent => {
          const { isDefaultVisible, showSelf } = renderInfo[parent.id]

          let renderChildren = parent.children
            .filter(child => showAll || renderInfo[child.id].isDefaultVisible)
            .map((child, idx, arr) => (
              <Row
                key={'child' + child.id}
                id={child.id}
                month={month}
                metric={metric}
                isDefaultVisible={renderInfo[child.id].isDefaultVisible}
                isLastVisibleChild={idx === arr.length - 1}
                isReordering={reorderMode}
                openTransactionsPopover={onShowExactTransactions}
                openDetails={onOpenDetails}
              />
            ))

          if (showSelf) {
            renderChildren = [
              <Row
                isSelf
                key={'self' + parent.id}
                id={parent.id}
                month={month}
                metric={metric}
                isDefaultVisible={renderInfo[parent.id].isDefaultVisible}
                isReordering={reorderMode}
                openTransactionsPopover={onShowExactTransactions}
                openDetails={onOpenDetails}
              />,
              ...renderChildren,
            ]
          }

          const isExpanded =
            !!renderChildren.length && expanded.includes(parent.id)

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
                  id={parent.id}
                  month={month}
                  metric={metric}
                  isDefaultVisible={isDefaultVisible}
                  isExpanded={isExpanded}
                  isReordering={reorderMode}
                  openDetails={onOpenDetails}
                  openTransactionsPopover={onShowTransactions}
                />
              }
              children={renderChildren}
            />
          )
        })

      return {
        group,
        groupIdx,
        renderChildren: parents,
      }
    })
    .filter(data => data.renderChildren.length)
    .map((data, index, array) => {
      const { group, groupIdx, renderChildren } = data
      const prevVisibleIdx = array[index - 1]?.groupIdx
      const nextVisibleIdx = array[index + 1]?.groupIdx
      return (
        <Group
          key={group.id}
          name={group.id}
          groupIdx={groupIdx}
          prevIdx={prevVisibleIdx}
          nextIdx={nextVisibleIdx}
          isReordering={reorderMode}
        >
          {renderChildren}
        </Group>
      )
    })

  return (
    <>
      <Paper className={className} sx={{ position: 'relative', pb: 1 }}>
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
        <Footer month={month} metric={metric} />
      </Paper>
      <Highlight />
    </>
  )
}

export const EnvelopeTable = memo(
  (props: TagTableProps) => <EnvelopeTable2 {...props} />,
  shallowEqual
)
