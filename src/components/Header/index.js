import React from 'react'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'

import { makeStyles } from '@material-ui/styles'
import RefreshButton from './containers/RefreshButton'
import MenuButton from './containers/MenuButton'
import InfoIcon from '@material-ui/icons/Info'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import Box from '@material-ui/core/Box'
import Hidden from '@material-ui/core/Hidden'

const routes = [
  { path: '/transactions', label: 'История' },
  { path: '/budget', label: 'Бюджет' },
]

const useStyles = makeStyles({ toolbar: { minHeight: 48 } })

const Header = ({ match }) => {
  const classes = useStyles()
  return (
    <AppBar color="default">
      <Toolbar className={classes.toolbar}>
        <Hidden smDown>
          <Typography variant="h6" color="inherit">
            ZERRO
          </Typography>
        </Hidden>

        <Box flexGrow={1}>
          <Tabs
            value={routes.findIndex(route => route.path === match.path)}
            indicatorColor="primary"
            centered
          >
            {routes.map(route => (
              <Tab
                component={Link}
                label={route.label}
                to={route.path}
                key={route.path}
              />
            ))}
          </Tabs>
        </Box>

        <Tooltip title="О проекте">
          <IconButton
            color="inherit"
            component="a"
            href="https://www.notion.so/More-Money-ae7dee79e1b446dd81bf279e72eb6970"
            target="_blank"
            rel="noopener noreferrer"
          >
            <InfoIcon />
          </IconButton>
        </Tooltip>
        <RefreshButton color="inherit" />
        <MenuButton color="inherit" />
      </Toolbar>
    </AppBar>
  )
}

export default withRouter(Header)
