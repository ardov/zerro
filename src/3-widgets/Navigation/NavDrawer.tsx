import type { FC } from 'react'
import React from 'react'
import { useMatch } from 'react-router-dom'
import { Link } from 'react-router-dom'
import RefreshButton from '3-widgets/RefreshButton'
import { MenuButton } from './MenuButton'
import type { DrawerProps } from '@mui/material'
import {
  Drawer,
  Divider,
  List,
  ListItemText,
  ListItemIcon,
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
      <div className="relative flex h-full flex-col items-center">
        <div className="w-full px-2 pt-4">
          <Links />
        </div>

        <div className="w-full py-6">
          <Divider />
        </div>

        <div className="w-full px-2">
          <AccountList />
        </div>

        <div className="w-full px-2">
          <DebtorList />
        </div>

        <div className="h-16 w-full shrink-0" />

        <div className="sticky inset-x-0 bottom-0 z-[5] mt-auto flex w-full shrink-0 flex-row items-center bg-card px-6 pb-4 pt-2">
          <Logo fill={theme.palette.primary.main} width="100" />
          <div className="ml-auto">
            <RefreshButton />
            <MenuButton edge="end" />
          </div>
        </div>
      </div>
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
  const match = useMatch({ path, end: false })
  return (
    <ListItemButton
      className="rounded-lg"
      selected={!!match}
      component={Link}
      to={path}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={text} />
    </ListItemButton>
  )
}
