import React, { FC } from 'react'
import { useRouteMatch } from 'react-router-dom'
import { Link } from 'react-router-dom'
import RefreshButton from '3-widgets/RefreshButton'
import { MenuButton } from './MenuButton'
import {
  Box,
  Drawer,
  Divider,
  List,
  ListItemText,
  ListItemIcon,
  DrawerProps,
  ListItemButton,
} from '@mui/material'
import {
  AccountBalanceIcon,
  HelpOutlineIcon,
  FavoriteBorderIcon,
  SyncAltIcon,
  WhatshotIcon,
  BarChartIcon,
} from '6-shared/ui/Icons'
import { Logo } from '6-shared/ui/Logo'
import { useAppTheme } from '6-shared/ui/theme'

import AccountList from '3-widgets/account/AccountList'
import { DebtorList } from '3-widgets/DebtorList'
import { useTranslation } from 'react-i18next'

export default function NavigationDrawer(props: DrawerProps) {
  const theme = useAppTheme()

  return (
    <Drawer {...props}>
      <Box
        sx={{
          display: 'flex',
          position: 'relative',
          flexDirection: 'column',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Box
          sx={{
            width: '100%',
            px: 1,
            pt: 2,
          }}
        >
          <Links />
        </Box>

        <Box
          sx={{
            width: '100%',
            py: 3,
          }}
        >
          <Divider />
        </Box>

        <Box
          sx={{
            width: '100%',
            px: 1,
          }}
        >
          <AccountList />
        </Box>

        <Box
          sx={{
            width: '100%',
            px: 1,
          }}
        >
          <DebtorList />
        </Box>

        <Box
          sx={{
            height: 64,
            width: '100%',
            flexShrink: 0,
          }}
        />

        <Box
          sx={{
            bgcolor: 'background.paper',
            width: '100%',
            pt: 1,
            pb: 2,
            px: 3,
            mt: 'auto',
            position: 'sticky',
            bottom: '0',
            left: '0',
            right: '0',
            zIndex: '5',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'row',
          }}
        >
          <Logo fill={theme.palette.primary.main} width="100" />
          <Box
            sx={{
              ml: 'auto',
            }}
          >
            <RefreshButton />
            <MenuButton edge="end" />
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

function Links() {
  const { t } = useTranslation('navigation')
  return (
    <List>
      <NavigationLink
        text={t('budget')}
        path="/budget"
        icon={<AccountBalanceIcon />}
      />
      <NavigationLink
        text={t('transactions')}
        path="/transactions"
        icon={<SyncAltIcon />}
      />
      <NavigationLink text={t('stats')} path="/stats" icon={<BarChartIcon />} />
      <NavigationLink
        text={t('yearWrapped')}
        path="/review"
        icon={<WhatshotIcon />}
      />
      <NavigationLink
        text={t('about')}
        path="/about"
        icon={<HelpOutlineIcon />}
      />
      <NavigationLink
        text={t('donate')}
        path="/donation"
        icon={<FavoriteBorderIcon />}
      />
    </List>
  )
}

const NavigationLink: FC<{
  icon: React.ReactNode
  text: React.ReactNode
  path: string
}> = ({ icon, text, path }) => {
  const match = useRouteMatch(path)
  return (
    <ListItemButton
      sx={{ borderRadius: 1 }}
      selected={!!match}
      component={Link}
      to={path}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={text} />
    </ListItemButton>
  )
}
