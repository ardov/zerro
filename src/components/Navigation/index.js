import React, { useState } from 'react'
import { useMediaQuery, Fab } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import MenuIcon from '@material-ui/icons/Menu'
import NavDrawer from './NavDrawer'

const useStyles = makeStyles(theme => ({
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    left: theme.spacing(2),
    zIndex: 5,
  },
  drawerWidth: { width: 120 },
}))

export default function Header() {
  const [open, setOpen] = useState(false)
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const c = useStyles()

  const showDrawer = () => setOpen(true)
  const hideDrawer = () => setOpen(false)

  const menuOpen = !isMobile || open

  return (
    <>
      {!menuOpen && (
        <Fab
          className={c.fab}
          color="primary"
          onClick={showDrawer}
          children={<MenuIcon />}
        />
      )}

      <NavDrawer
        classes={
          isMobile ? null : { paper: c.drawerWidth, root: c.drawerWidth }
        }
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={menuOpen}
        onClose={hideDrawer}
      />
    </>
  )
}
