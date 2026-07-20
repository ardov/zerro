import type { FC } from 'react'
import type { ButtonBaseProps } from '@mui/material'
import { ButtonBase } from '@mui/material'

const style = {
  py: 1,
  px: 1.5,
  my: -1,
  mx: -1.5,
  borderRadius: 1,
  minWidth: 0,
  transition: '0.1s',
  textAlign: 'right',
  typography: 'body1',
  '&:hover': { bgcolor: 'action.hover' },
  '&:focus': { bgcolor: 'action.focus' },
}

export const Btn: FC<ButtonBaseProps> = props => (
  <ButtonBase sx={style} {...props} />
)
