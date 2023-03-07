import React, { FC, useRef } from 'react'
import { ButtonBase, IconButton, Typography, Box } from '@mui/material'
import { AddIcon, ArrowDownwardIcon, ArrowUpwardIcon } from '@shared/ui/Icons'
import { useFloatingInput } from '@shared/ui/FloatingInput'
import { Tooltip } from '@shared/ui/Tooltip'

import { useAppDispatch } from '@store/index'
import { renameGroup } from '@features/envelope/renameGroup'
import { moveGroup } from '@features/envelope/moveGroup'
import { createEnvelope } from '@features/envelope/createEnvelope'
import { TableRow } from './shared/shared'

type TGroupProps = {
  name: string
  groupIdx: number
  prevIdx?: number
  nextIdx?: number
  isReordering: boolean
  children?: React.ReactNode[]
}
export const Group: FC<TGroupProps> = ({
  name,
  groupIdx,
  prevIdx,
  nextIdx,
  isReordering,
  children,
}) => {
  const dispatch = useAppDispatch()
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
        pt: 1,
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
          borderBottom: `0.5px solid black`,
          borderColor: 'divider',
          '&:last-child': { border: 0 },
        }}
        name={NameCell}
        budgeted={null}
        outcome={null}
        available={null}
        goal={null}
      />

      {children}
    </>
  )
}
