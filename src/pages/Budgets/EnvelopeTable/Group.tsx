import React, { FC, useState } from 'react'
import {
  ButtonBase,
  IconButton,
  TextField,
  Typography,
  Box,
} from '@mui/material'
import { useToggle } from '@shared/hooks/useToggle'
import { ArrowDownwardIcon, ArrowUpwardIcon } from '@shared/ui/Icons'
import { Tooltip } from '@shared/ui/Tooltip'
import { useAppDispatch } from '@store/index'
import { renameGroup } from '@features/envelope/renameGroup'
import { moveGroup } from '@features/envelope/moveGroup'
import { rowStyle } from './shared/shared'

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
          <Box
            sx={{
              pb: 0,
              pt: 1,
              display: 'flex',
              flexDirection: 'row',
              alignContent: 'flex-end',
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}
          >
            <ButtonBase
              sx={{ p: 1, ml: -1 }}
              onClick={() => {
                setValue(name)
                toggleInput()
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
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
        )}
      </Box>
      {children}
    </>
  )
}
