import React, { FC } from 'react'
import { Box } from '@mui/material'
import { Amount } from '6-shared/ui/Amount'

import { Btn } from './Btn'

type BudgetCellProps = {
  value: number
  isSelf?: boolean
  onBudgetClick: React.MouseEventHandler<HTMLButtonElement>
}

export const BudgetCell: FC<BudgetCellProps> = props => {
  const { value, onBudgetClick, isSelf } = props
  return (
    <Box
      color={isSelf ? 'text.hint' : value ? 'text.primary' : 'text.hint'}
      display="flex"
      justifyContent="flex-end"
    >
      <Btn onClick={onBudgetClick} disabled={isSelf}>
        <Amount value={value} decMode="ifOnly" />
      </Btn>
    </Box>
  )
}
