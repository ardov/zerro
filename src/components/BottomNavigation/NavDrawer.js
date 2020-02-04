import React from 'react'
import { Link } from 'react-router-dom'
import RefreshButton from './containers/RefreshButton'
import MenuButton from './containers/MenuButton'
import {
  Box,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
} from '@material-ui/core'
// import { useTheme } from '@material-ui/styles'

// import { makeStyles } from '@material-ui/styles'
import AccountBalanceIcon from '@material-ui/icons/AccountBalance'
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'
import SyncAltIcon from '@material-ui/icons/SyncAlt'

const routes = [
  { path: '/budget', label: 'Бюджет', icon: <AccountBalanceIcon /> },
  { path: '/transactions', label: 'Операции', icon: <SyncAltIcon /> },
]

// const useStyles = makeStyles(theme => ({
//   listItem: { borderRadius: theme.shape.borderRadius },
// }))

const NavigationDrawer = ({
  location,
  match,
  history,
  staticContext,
  onNavigate,
  ...rest
}) => {
  // const c = useStyles()
  // const theme = useTheme()
  const [value, setValue] = React.useState('recents')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }
  return (
    <Box position="fixed" width="100%" bottom="0" clone>
      <BottomNavigation
        value={value}
        onChange={handleChange}
        // className={classes.root}
      >
        {routes.map(route => (
          <BottomNavigationAction
            label={route.label}
            value={route.path}
            icon={route.icon}
            key={route.path}
            // selected={route.path === location}
            // component={Link}
            // to={route.path}
            // onClick={onNavigate}
          />
        ))}

        <BottomNavigationAction
          label="Folder"
          value="folder"
          component="a"
          href="https://www.notion.so/ZERRO-a943f930d0a64d008712e20ecd299dbd"
          target="_blank"
          rel="noopener noreferrer"
          icon={<HelpOutlineIcon />}
        />
        <RefreshButton />
        <MenuButton />
      </BottomNavigation>
    </Box>
  )
}

export default NavigationDrawer

/*
    <Box display="flex" position="fixed" width="100%" bottom="0">
      <Box width="100%" display="flex" justifyContent="space-around" py={1}>
        {routes.map(route => (
          <IconButton
            // selected={route.path === location}
            key={route.path}
            // component={Link}
            // to={route.path}
            // onClick={onNavigate}
          >
            {route.icon}
          </IconButton>
        ))}

        <IconButton
          component="a"
          href="https://www.notion.so/ZERRO-a943f930d0a64d008712e20ecd299dbd"
          target="_blank"
          rel="noopener noreferrer"
          children={<HelpOutlineIcon />}
        />

        <RefreshButton />
        <MenuButton />
      </Box>
    </Box>
    */
