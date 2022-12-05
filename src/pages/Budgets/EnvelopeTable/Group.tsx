import React, { FC, useRef } from 'react'
import { ButtonBase, IconButton, Typography, Box } from '@mui/material'
import { ArrowDownwardIcon, ArrowUpwardIcon } from '@shared/ui/Icons'
import { Tooltip } from '@shared/ui/Tooltip'
import { useAppDispatch } from '@store/index'
import { renameGroup } from '@features/envelope/renameGroup'
import { moveGroup } from '@features/envelope/moveGroup'
import { rowStyle } from './shared/shared'
import { useFloatingInput } from '@shared/ui/FloatingInput'

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

  return (
    <>
      {floating.render()}
      <Box
        sx={{
          ...rowStyle,
          borderBottom: `0.5px solid black`,
          borderColor: 'divider',
          '&:last-child': { border: 0 },
        }}
      >
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
            onClick={() => {
              floating.open(name)
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900 }} noWrap>
              {name}
            </Typography>
          </ButtonBase>

          {isReordering && nextIdx !== undefined && (
            <Tooltip title="Опустить ниже">
              <IconButton
                onClick={() => dispatch(moveGroup(groupIdx, nextIdx))}
              >
                <ArrowDownwardIcon />
              </IconButton>
            </Tooltip>
          )}

          {isReordering && prevIdx !== undefined && (
            <Tooltip title="Поднять выше">
              <IconButton
                onClick={() => dispatch(moveGroup(groupIdx, prevIdx))}
              >
                <ArrowUpwardIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      {children}
    </>
  )
}
