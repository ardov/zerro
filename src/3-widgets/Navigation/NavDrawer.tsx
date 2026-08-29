import type { FC } from 'react'
import React from 'react'
import { useMatch } from 'react-router-dom'
import { Link } from 'react-router-dom'
import RefreshButton from '3-widgets/RefreshButton'
import { MenuButton } from './MenuButton'
import { ListRowIcon, ListRowText, listItemClass } from '6-shared/ui/ListRow'
import { Divider } from '6-shared/ui/Divider'
import { cn } from '6-shared/ui/shadcn/utils'
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

/** MUI's docked `Drawer`, which is two boxes rather than one: a root that
 * reserves the panel's width in the page flow, and the panel itself, which is
 * fixed and scrolls on its own. It is never dismissed — the mobile layout
 * swaps in `MobileNavigation` instead — so there is no open state, no
 * backdrop and no focus trap here.
 *
 * Its scrollbar is hidden. The panel scrolls, but a permanent gutter down the
 * side of the navigation is noise. */
export default function NavigationDrawer() {
  const theme = useAppTheme()

  return (
    // The spacer. It takes no `className`: the two boxes want opposite things
    // from one, and a caller styling "the drawer" would land on this one and
    // miss the panel it meant.
    <div className="w-[280px] shrink-0">
      <nav className="fixed inset-y-0 left-0 z-drawer flex h-full w-[280px] flex-col overflow-y-auto border-0 border-r border-solid border-border bg-card text-card-foreground outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      </nav>
    </div>
  )
}

function Links() {
  const { t } = useTranslation('navigation')
  return (
    <ul className="m-0 flex list-none flex-col p-0 py-2">
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
    </ul>
  )
}

/** A real list of links, which is what MUI's `ListItemButton component={Link}`
 * rendered anyway. `aria-current` is what marks the open section; the row's
 * `data-selected` only paints it. */
const NavigationLink: FC<{
  icon: React.ReactNode
  text: React.ReactNode
  path: string
}> = ({ icon, text, path }) => {
  const match = useMatch({ path, end: false })
  return (
    <li className="contents">
      <Link
        to={path}
        aria-current={match ? 'page' : undefined}
        data-selected={match ? '' : undefined}
        className={cn(listItemClass, 'no-underline')}
      >
        <ListRowIcon>{icon}</ListRowIcon>
        <ListRowText className="my-1">{text}</ListRowText>
      </Link>
    </li>
  )
}
