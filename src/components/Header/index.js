import React from 'react'
import { Main, Name, NavLink, Buttons } from './styles'
import RefreshButton from './containers/RefreshButton'
import MenuButton from './containers/MenuButton'
import InfoIcon from '@material-ui/icons/Info'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'

export default function Header() {
  return (
    <Main>
      <Name>ZERRO</Name>

      <div>
        <NavLink to="/transactions">История</NavLink>
        {/* <NavLink to="/tags">Категории</NavLink> */}
        <NavLink to="/budget">Бюджет</NavLink>
      </div>
      <Buttons>
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
        <RefreshButton />
        <MenuButton />
      </Buttons>
    </Main>
  )
}
