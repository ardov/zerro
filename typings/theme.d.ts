import { Theme as MaterialTheme } from '@material-ui/core'

declare module '@material-ui/styles/defaultTheme' {
  interface DefaultTheme extends MaterialTheme {}
}

declare module '@emotion/react' {
  interface Theme extends MaterialTheme {}
}
