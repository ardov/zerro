import React from 'react'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import RefreshButton from './containers/RefreshButton'
import MenuButton from './containers/MenuButton'
import { Typography, Tabs, Tab, Box, Drawer } from '@material-ui/core'
import { withStyles } from '@material-ui/styles'

const routes = [
  { path: '/transactions', label: 'История' },
  { path: '/budget', label: 'Бюджет' },
]

const NavDrawer = withStyles({ root: { width: 120 }, paper: { width: 120 } })(
  Drawer
)

const SmallTab = withStyles({ root: { minWidth: 120 } })(Tab)

const Header = ({ match }) => (
  <NavDrawer variant="persistent" anchor="left" open={true}>
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      minHeight="100vh"
    >
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
            <SmallTab
              component={Link}
              label={route.label}
              to={route.path}
              key={route.path}
            />
          ))}
          <SmallTab
            label="О проекте"
            component="a"
            href="https://www.notion.so/ZERRO-a943f930d0a64d008712e20ecd299dbd"
            target="_blank"
            rel="noopener noreferrer"
          />
        </Tabs>
      </Box>

      <Box mt="auto" py={3} display="flex" flexDirection="column">
        <RefreshButton />
        <MenuButton />
      </Box>
    </Box>
  </NavDrawer>
)

export default withRouter(Header)
