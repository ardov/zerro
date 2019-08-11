import React from 'react'
import { connect } from 'react-redux'
import { Menu, Dropdown, Icon } from 'antd'
import { logOut } from 'logic/authorization'
import exportCsv from 'logic/exportCsv'
import exportJSON from 'logic/exportJSON'
import { syncData } from 'logic/sync'
import { getChangedNum } from 'store/data/dataSelectors'
import { getLastSyncTime } from 'store/data/serverTimestamp'
import { getPendingState } from 'store/isPending'
import { Main, Name, NavLink, Buttons, StyledButton } from './styles'

function Header({
  exportCsv,
  exportJSON,
  syncData,
  logOut,
  changedNum,
  lastSync,
  isPending,
}) {
  const SettingsMenu = (
    <Menu>
      <Menu.Item key="1" onClick={exportCsv}>
        <Icon type="download" />
        Скачать CSV
      </Menu.Item>
      <Menu.Item key="2" onClick={exportJSON}>
        <Icon type="download" />
        Полный бэкап
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logOut" onClick={logOut}>
        <Icon type="logout" />
        Выйти
      </Menu.Item>
    </Menu>
  )
  return (
    <Main>
      <Name>More Money Now</Name>

      <div>
        <NavLink to="/transactions">История</NavLink>
        {/* <NavLink to="/tags">Категории</NavLink> */}
        <NavLink to="/budget">Бюджет</NavLink>
      </div>
      <Buttons>
        <StyledButton
          icon="reload"
          onClick={syncData}
          loading={isPending}
          type={changedNum ? 'primary' : ''}
        >
          {changedNum ? `Сохранить (${changedNum})` : `Обновить`}
        </StyledButton>

        <Dropdown overlay={SettingsMenu} trigger={['click']}>
          <StyledButton icon="setting" />
        </Dropdown>
      </Buttons>
    </Main>
  )
}

const mapDispatchToProps = dispatch => ({
  logOut: () => dispatch(logOut()),
  syncData: () => dispatch(syncData()),
  exportCsv: () => dispatch(exportCsv),
  exportJSON: () => dispatch(exportJSON),
})

export default connect(
  state => ({
    changedNum: getChangedNum(state),
    lastSync: getLastSyncTime(state),
    isPending: getPendingState(state),
  }),
  mapDispatchToProps
)(Header)
