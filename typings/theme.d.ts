import { Theme as MaterialTheme } from '@material-ui/core'
import { RootState } from 'store'

declare module '@material-ui/styles/defaultTheme' {
  interface DefaultTheme extends MaterialTheme {}
}

declare module '@emotion/react' {
  interface Theme extends MaterialTheme {}
}

declare module 'react-redux' {
  interface DefaultRootState extends RootState {}
}
