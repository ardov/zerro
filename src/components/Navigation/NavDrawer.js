import React from 'react'
import { useLocation } from 'react-router'
import { Link } from 'react-router-dom'
import RefreshButton from 'components/RefreshButton'
import MenuButton from './containers/MenuButton'
import {
  Box,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@material-ui/core'
import { useTheme } from '@material-ui/styles'
import Logo from 'components/Logo'
import AccountList from 'components/AccountList'
import { makeStyles } from '@material-ui/styles'
import AccountBalanceIcon from '@material-ui/icons/AccountBalance'
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder'
import SyncAltIcon from '@material-ui/icons/SyncAlt'

const routes = [
  { path: '/budget', label: 'Бюджет', icon: <AccountBalanceIcon /> },
  { path: '/transactions', label: 'Операции', icon: <SyncAltIcon /> },
]

const useStyles = makeStyles(theme => ({
  listItem: { borderRadius: theme.shape.borderRadius },
}))

export default function NavigationDrawer(props) {
  const c = useStyles()
  const theme = useTheme()
  const path = useLocation().pathname
  return (
    <Drawer {...props}>
      <Box
        display="flex"
        position="relative"
        flexDirection="column"
        alignItems="center"
        height="100%"
      >
        <Box width="100%" px={1} pt={2}>
          <List>
            {routes.map(route => (
              <ListItem
                className={c.listItem}
                button
                selected={path.startsWith(route.path)}
                key={route.path}
                component={Link}
                to={route.path}
              >
                <ListItemIcon>{route.icon}</ListItemIcon>
                <ListItemText primary={route.label} />
              </ListItem>
            ))}
            <ListItem
              className={c.listItem}
              button
              component="a"
              href="https://www.notion.so/ZERRO-a943f930d0a64d008712e20ecd299dbd"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ListItemIcon>
                <HelpOutlineIcon />
              </ListItemIcon>
              <ListItemText primary="Как пользоваться" />
            </ListItem>

            <ListItem
              className={c.listItem}
              button
              component="a"
              href="https://money.yandex.ru/to/4100110993756505/200"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ListItemIcon>
                <FavoriteBorderIcon />
              </ListItemIcon>
              <ListItemText primary="Поддержать проект" />
            </ListItem>
          </List>
        </Box>

        <Box width="100%" py={3}>
          <Divider />
        </Box>

        <Box width="100%" px={1}>
          <AccountList />
        </Box>

        <Box height={64} width="100%" flexShrink="0" />

        <Box
          bgcolor="background.paper"
          width="100%"
          pt={1}
          pb={2}
          px={3}
          mt="auto"
          position="sticky"
          bottom="0"
          left="0"
          right="0"
          zIndex="5"
          flexShrink="0"
          display="flex"
          alignItems="center"
          flexDirection="row"
        >
          <Logo fill={theme.palette.primary.main} width="100" />
          <Box ml="auto">
            <RefreshButton />
            <MenuButton edge="end" />
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}
