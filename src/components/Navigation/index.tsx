import React from 'react'
import NavDrawer from './NavDrawer'
import { MobileNavigation } from './MobileNavigation'

const drawerWidth = 280
const contentSx = {
  width: drawerWidth,
  [`& .MuiDrawer-paper`]: {
    width: drawerWidth,
    scrollbarWidth: 'none',
    overflow: '-moz-scrollbars-none',
    '&::-webkit-scrollbar': { display: 'none' },
  },
}

export default function Header() {
  return (
    <NavDrawer sx={contentSx} variant="persistent" anchor="left" open={true} />
  )
}

export { MobileNavigation }
