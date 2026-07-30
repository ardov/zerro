import type { FC } from 'react'
import React, { useRef } from 'react'
import { core } from 'zerro-core/redux'

import { ButtonBase, IconButton, Typography, Box } from '@mui/material'
import { deepEqual } from '6-shared/helpers/deepEqual'
import { AddIcon, ArrowDownwardIcon, ArrowUpwardIcon } from '6-shared/ui/Icons'
import { useFloatingInput } from '6-shared/ui/FloatingInput'
import { Tooltip } from '6-shared/ui/Tooltip'

import { useAppDispatch, useAppSelector } from 'store/index'
import { renameGroup } from '4-features/envelope/renameGroup'
import { moveGroup } from '4-features/envelope/moveGroup'
import { createEnvelopeInGroup } from '4-features/envelope/createEnvelope'
import { TableRow } from './shared/shared'
import type { TFxAmount } from '6-shared/types'

import { addFxAmount } from '6-shared/helpers/money'
import { useMonth } from '../MonthProvider'
import { Amount } from '6-shared/ui/Amount'
import { useTranslation } from 'react-i18next'

type TGroupProps = {
  name: string
  groupIdx: number
  prevIdx?: number
  nextIdx?: number
  isReordering: boolean
  children?: React.ReactNode[]
}
const Sum: FC<{ value: number }> = ({ value }) => (
  <Typography
    align="right"
    noWrap
    sx={{
      alignSelf: 'baseline',
      color: 'text.disabled',
    }}
  >
    <Amount value={value} decimals="ifOnly" />
  </Typography>
)

export const Group: FC<TGroupProps> = ({
  name,
  groupIdx,
  prevIdx,
  nextIdx,
  isReordering,
  children,
}) => {
  const { t } = useTranslation('budgets')
  const dispatch = useAppDispatch()
  const { assigned, available, activity } = useGroupTotals(name)
  const ref = useRef<HTMLDivElement>(null)

  const floating = useFloatingInput(ref, val =>
    dispatch(renameGroup(name, val))
  )

  const Actions = (
    <>
      {nextIdx !== undefined && (
        <Tooltip title={t('moveDown')}>
          <IconButton onClick={() => dispatch(moveGroup(groupIdx, nextIdx))}>
            <ArrowDownwardIcon />
          </IconButton>
        </Tooltip>
      )}

      {prevIdx !== undefined && (
        <Tooltip title={t('moveUp')}>
          <IconButton onClick={() => dispatch(moveGroup(groupIdx, prevIdx))}>
            <ArrowUpwardIcon />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title={t('createEnvelope')}>
        <IconButton onClick={() => dispatch(createEnvelopeInGroup(name))}>
          <AddIcon />
        </IconButton>
      </Tooltip>
    </>
  )

  const NameCell = (
    <Box
      ref={ref}
      sx={{
        pb: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'row',
        alignContent: 'flex-end',
        justifyContent: 'flex-start',
        alignItems: 'center',
      }}
    >
      <ButtonBase
        sx={{ p: 1, ml: -1, minWidth: 0, flexShrink: 1 }}
        onClick={() => floating.open(name)}
      >
        <Typography variant="h6" sx={{ fontWeight: 900 }} noWrap>
          {name}
        </Typography>
      </ButtonBase>

      {isReordering && Actions}
    </Box>
  )

  return (
    <>
      {floating.render()}
      <TableRow
        sx={{
          pt: 2,
          alignItems: 'baseline',
          borderBottom: `0.5px solid black`,
          borderColor: 'divider',
          '&:last-child': { border: 0 },
        }}
        name={NameCell}
        assigned={<Sum value={assigned} />}
        outcome={<Sum value={activity} />}
        available={<Sum value={available} />}
        goal={null}
      />

      {children}
    </>
  )
}

const useGroupTotals = (id: string) => {
  type TResultFx = {
    assigned: TFxAmount
    activity: TFxAmount
    available: TFxAmount
  }
  type TResult = {
    assigned: number
    activity: number
    available: number
  }
  const [month] = useMonth()
  const data = useAppSelector(core.activity.selectEnvelopeMetrics)[month]
  const structure = useAppSelector(core.envelopes.selectStructure, deepEqual)
  const toDisplay = core.currency.useToDisplay(month)
  const group = structure.find(gr => gr.id === id)
  if (!group || !data) return { assigned: 0, activity: 0, available: 0 }

  const fxSum = group.children.reduce(
    (sum, node) => {
      sum.assigned = addFxAmount(sum.assigned, data[node.id].totalAssigned)
      sum.activity = addFxAmount(sum.activity, data[node.id].totalActivity)
      sum.available = addFxAmount(sum.available, data[node.id].totalAvailable)
      return sum
    },
    { assigned: {}, activity: {}, available: {} } as TResultFx
  )

  return {
    assigned: toDisplay(fxSum.assigned),
    activity: toDisplay(fxSum.activity),
    available: toDisplay(fxSum.available),
  } as TResult
}
