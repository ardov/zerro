import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import NavDrawer from './NavDrawer'

const useStyles = makeStyles(theme => ({
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    left: theme.spacing(2),
    zIndex: 5,
  },
  drawerWidth: {
    width: 280,
    scrollbarWidth: 'none',
    overflow: '-moz-scrollbars-none',
    '&::-webkit-scrollbar': { display: 'none' },
  },
}))

export default function Header() {
  const c = useStyles()
  return (
    <NavDrawer
      classes={{ paper: c.drawerWidth, root: c.drawerWidth }}
      variant="persistent"
      anchor="left"
      open={true}
    />
  )
}
