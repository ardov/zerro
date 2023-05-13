import React from 'react'
import { Stack, StackProps } from '@mui/system'

type RhythmProps = StackProps & {
  gap?: number
  axis?: 'y' | 'x'
}

export default function Rhythm({
  gap = 0,
  axis = 'y',
  children,
  ...rest
}: RhythmProps) {
  return (
    <Stack direction={axis === 'x' ? 'row' : undefined} spacing={gap}>
      {children}
    </Stack>
  )
}
