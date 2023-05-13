import { Theme as MaterialTheme } from '@mui/material'
import { RootState } from '@store'

declare module '@emotion/react' {
  interface Theme extends MaterialTheme {}
}

declare module 'react-redux' {
  interface DefaultRootState extends RootState {}
}
