import React, { FC } from 'react'
import { Typography, Box } from '@mui/material'
import { Amount } from '6-shared/ui/Amount'
import { Btn } from './Btn'

type ActivityCellProps = {
  value: number
  onClick: React.MouseEventHandler<HTMLButtonElement>
}

export const ActivityCell: FC<ActivityCellProps> = props => {
  const { value: displayActivity, onClick } = props
  return (
    <Box
      display="flex"
      justifyContent="flex-end"
      color={displayActivity ? 'text.primary' : 'text.hint'}
    >
      <Btn onClick={onClick}>
        <Typography variant="body1" align="right">
          <Amount value={displayActivity} decMode="ifOnly" />
        </Typography>
      </Btn>
    </Box>
  )
}
