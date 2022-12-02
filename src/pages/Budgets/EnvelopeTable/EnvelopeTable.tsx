import React, { FC, memo, useCallback, useEffect, useState } from 'react'
import { shallowEqual } from 'react-redux'
import {
  ButtonBase,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { TEnvelopeId, TISOMonth } from '@shared/types'
import { useToggle } from '@shared/hooks/useToggle'
import { useAppDispatch, useAppSelector } from '@store/index'
import { envelopeModel } from '@entities/envelope'
import { Parent } from './Parent'
import { Row } from './Row'
import { Header } from './Header'
import { rowStyle } from './shared/shared'
import { trMode } from '../TransactionsDrawer'
import { useMetric } from './models/useMetric'
import { useExpandEnvelopes } from './models/useExpandEnvelopes'
import { Highlight } from './Highlight'
import { useEnvRenderInfo } from './models/envRenderInfo'
import { isEqual } from 'lodash'
import { Footer } from './Footer'
import { renameGroup } from '@features/envelope/renameGroup'
import { Box } from '@mui/system'
import { moveGroupDown } from '@features/envelope/moveGroupDown'
import { ArrowDownwardIcon } from '@shared/ui/Icons'
import { Tooltip } from '@shared/ui/Tooltip'

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

  const renderGroups = structure.map(group => {
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
    if (!parents.length) return null
    return (
      <EnvelopeGroup key={group.id} name={group.id}>
        {parents}
      </EnvelopeGroup>
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

type TEnvelopeGroupProps = {
  name: string
  children?: React.ReactNode[]
}

const EnvelopeGroup: FC<TEnvelopeGroupProps> = ({ name, children }) => {
  const dispatch = useAppDispatch()
  const [value, setValue] = useState(name)
  const [showInput, toggleInput] = useToggle(false)

  return (
    <>
      <Box
        sx={{
          ...rowStyle,
          borderBottom: `0.5px solid black`,
          borderColor: 'divider',
          '&:last-child': { border: 0 },
          '&:hover .arrowBtn': { opacity: 1 },
          '& .arrowBtn': { opacity: 0.1, transition: '200ms ease' },
        }}
      >
        {showInput ? (
          <TextField
            sx={{ ml: -1 }}
            autoFocus
            name="groupName"
            inputProps={{ autoComplete: 'off' }}
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={() => {
              toggleInput()
              if (value !== name) dispatch(renameGroup(name, value))
            }}
          />
        ) : (
          <span>
            <ButtonBase
              sx={{ pb: 1, pt: 2 }}
              onClick={() => {
                setValue(name)
                toggleInput()
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {name}
              </Typography>
            </ButtonBase>
            <Tooltip title="Опустить вниз">
              <IconButton
                className="arrowBtn"
                sx={{ mt: 1.5, ml: 1 }}
                onClick={() => dispatch(moveGroupDown(name))}
              >
                <ArrowDownwardIcon />
              </IconButton>
            </Tooltip>
          </span>
        )}
      </Box>
      {children}
    </>
  )
}
