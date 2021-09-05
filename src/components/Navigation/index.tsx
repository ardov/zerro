import React from 'react'
import { withStyles } from '@mui/styles'
import NavDrawer from './NavDrawer'
import { MobileNavigation } from './MobileNavigation'
import { CSSProperties } from '@mui/styles'

const style: CSSProperties = {
  width: 280,
  scrollbarWidth: 'none',
  overflow: '-moz-scrollbars-none',
  '&::-webkit-scrollbar': { display: 'none' },
}

const StyledNav = withStyles({
  root: style,
  paper: style,
})(NavDrawer)

export default function Header() {
  return <StyledNav variant="persistent" anchor="left" open={true} />
}

export { MobileNavigation }
