import { Theme as MaterialTheme } from '@mui/material'
import { RootState } from 'models'

declare module '@mui/styles/defaultTheme' {
  interface DefaultTheme extends MaterialTheme {}
}

declare module '@emotion/react' {
  interface Theme extends MaterialTheme {}
}

declare module 'react-redux' {
  interface DefaultRootState extends RootState {}
}
