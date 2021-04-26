import React, { FC } from 'react'
import { useRouteMatch } from 'react-router-dom'
import { Link } from 'react-router-dom'
import RefreshButton from 'components/RefreshButton'
import { MenuButton } from './MenuButton'
import {
  Box,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  DrawerProps,
} from '@material-ui/core'
import { useTheme } from '@material-ui/styles'
import Logo from 'components/Logo'
import AccountList from 'components/AccountList'
import { makeStyles } from '@material-ui/styles'
import AccountBalanceIcon from '@material-ui/icons/AccountBalance'
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder'
import SyncAltIcon from '@material-ui/icons/SyncAlt'
import WhatshotIcon from '@material-ui/icons/Whatshot'

export default function NavigationDrawer(props: DrawerProps) {
  const theme = useTheme()
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
          <Links />
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

function Links() {
  return (
    <List>
      <NavigationLink
        text="Бюджет"
        path="/budget"
        icon={<AccountBalanceIcon />}
      />
      <NavigationLink
        text="Операции"
        path="/transactions"
        icon={<SyncAltIcon />}
      />
      <NavigationLink
        text="Как пользоваться"
        path="/about"
        icon={<HelpOutlineIcon />}
      />
      <NavigationLink
        text="Поддержать проект"
        path="/donation"
        icon={<FavoriteBorderIcon />}
      />
      <NavigationLink
        text={<span className="red-gradient">Итоги года</span>}
        path="/review"
        icon={<WhatshotIcon />}
      />
    </List>
  )
}

const useStyles = makeStyles(theme => ({
  listItem: { borderRadius: theme.shape.borderRadius },
}))

const NavigationLink: FC<{
  icon: React.ReactNode
  text: React.ReactNode
  path: string
}> = ({ icon, text, path }) => {
  const c = useStyles()
  const match = useRouteMatch(path)
  return (
    <ListItem
      className={c.listItem}
      button
      selected={!!match}
      component={Link}
      to={path}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={text} />
    </ListItem>
  )
}
