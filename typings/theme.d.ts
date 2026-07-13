/* eslint-disable @typescript-eslint/no-empty-object-type -- intentional module augmentation */
import { Theme as MaterialTheme } from '@mui/material'
import { RootState } from 'store'

declare module '@emotion/react' {
  interface Theme extends MaterialTheme {}
}

declare module 'react-redux' {
  interface DefaultRootState extends RootState {}
}
