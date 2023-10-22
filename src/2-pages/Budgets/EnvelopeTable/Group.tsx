import React, { FC, useRef } from 'react'
import { ButtonBase, IconButton, Typography, Box } from '@mui/material'
import { isEqual } from 'lodash'
import { AddIcon, ArrowDownwardIcon, ArrowUpwardIcon } from '6-shared/ui/Icons'
import { useFloatingInput } from '6-shared/ui/FloatingInput'
import { Tooltip } from '6-shared/ui/Tooltip'

import { useAppDispatch, useAppSelector } from 'store/index'
import { renameGroup } from '4-features/envelope/renameGroup'
import { moveGroup } from '4-features/envelope/moveGroup'
import { createEnvelope } from '4-features/envelope/createEnvelope'
import { TableRow } from './shared/shared'
import { TFxAmount } from '6-shared/types'
import { balances } from '5-entities/envBalances'
import { envelopeModel } from '5-entities/envelope'
import { addFxAmount } from '6-shared/helpers/money'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { useMonth } from '../MonthProvider'
import { Amount } from '6-shared/ui/Amount'

type TGroupProps = {
  name: string
  groupIdx: number
  prevIdx?: number
  nextIdx?: number
  isReordering: boolean
  children?: React.ReactNode[]
}
// TODO: i18n
export const Group: FC<TGroupProps> = ({
  name,
  groupIdx,
  prevIdx,
  nextIdx,
  isReordering,
  children,
}) => {
  const dispatch = useAppDispatch()
  const { budgeted, available, activity } = useGroupTotals(name)
  const ref = useRef()

  const floating = useFloatingInput(ref, val =>
    dispatch(renameGroup(name, val))
  )

  const Actions = (
    <>
      {nextIdx !== undefined && (
        <Tooltip title="Опустить ниже">
          <IconButton onClick={() => dispatch(moveGroup(groupIdx, nextIdx))}>
            <ArrowDownwardIcon />
          </IconButton>
        </Tooltip>
      )}

      {prevIdx !== undefined && (
        <Tooltip title="Поднять выше">
          <IconButton onClick={() => dispatch(moveGroup(groupIdx, prevIdx))}>
            <ArrowUpwardIcon />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title="Создать категорию">
        <IconButton
          onClick={() =>
            dispatch(createEnvelope({ group: name, indexRaw: groupIdx }))
          }
        >
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

  const Sum: FC<{ value: number }> = ({ value }) => (
    <Typography alignSelf={'baseline'} color="text.hint" align="right" noWrap>
      <Amount value={value} decMode="ifOnly" />
    </Typography>
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
        budgeted={<Sum value={budgeted} />}
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
    budgeted: TFxAmount
    activity: TFxAmount
    available: TFxAmount
  }
  type TResult = {
    budgeted: number
    activity: number
    available: number
  }
  const [month] = useMonth()
  const data = balances.useEnvData()[month]
  const structure = useAppSelector(envelopeModel.getEnvelopeStructure, isEqual)
  const toDisplay = displayCurrency.useToDisplay(month)
  const group = structure.find(gr => gr.id === id)
  if (!group || !data) return { budgeted: 0, activity: 0, available: 0 }

  const fxSum = group.children.reduce(
    (sum, node) => {
      sum.budgeted = addFxAmount(sum.budgeted, data[node.id].totalBudgeted)
      sum.activity = addFxAmount(sum.activity, data[node.id].totalActivity)
      sum.available = addFxAmount(sum.available, data[node.id].totalAvailable)
      return sum
    },
    { budgeted: {}, activity: {}, available: {} } as TResultFx
  )

  return {
    budgeted: toDisplay(fxSum.budgeted),
    activity: toDisplay(fxSum.activity),
    available: toDisplay(fxSum.available),
  } as TResult
}
