import React from 'react'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import RefreshButton from './containers/RefreshButton'
import MenuButton from './containers/MenuButton'
import ThemeButton from './containers/ThemeButton'
import InfoIcon from '@material-ui/icons/Info'
import {
  IconButton,
  Tooltip,
  Typography,
  Tabs,
  Tab,
  Box,
  Drawer,
} from '@material-ui/core'
import { withStyles } from '@material-ui/styles'

const routes = [
  { path: '/transactions', label: 'История' },
  { path: '/budget', label: 'Бюджет' },
]

const NavDrawer = withStyles({ root: { width: 160 }, paper: { width: 160 } })(
  Drawer
)

const Header = ({ match }) => (
  <NavDrawer variant="persistent" anchor="left" open={true}>
    <Box display="flex" flexDirection="column" alignItems="center">
      <Box py={3}>
        <Typography variant="h6">ZERRO</Typography>
      </Box>

      <Box width="100%" py={3}>
        <Tabs
          value={routes.findIndex(route => route.path === match.path)}
          indicatorColor="primary"
          orientation="vertical"
          variant="scrollable"
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
          component="a"
          href="https://www.notion.so/More-Money-ae7dee79e1b446dd81bf279e72eb6970"
          target="_blank"
          rel="noopener noreferrer"
        >
          <InfoIcon />
        </IconButton>
      </Tooltip>
      <ThemeButton />
      <RefreshButton />
      <MenuButton />
    </Box>
  </NavDrawer>
)

export default withRouter(Header)
