import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Button } from 'antd'
import { Menu, Dropdown, Icon } from 'antd'
import { logOut } from 'logic/authorization'
import exportCsv from 'logic/exportCsv'
import exportJSON from 'logic/exportJSON'
import { syncData } from 'logic/sync'
import { getChangedNum } from 'store/data/dataSelectors'
import { getLastSyncTime } from 'store/data/serverTimestamp'
import { getPendingState } from 'store/isPending'

const Main = styled.header`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 40px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`

const Name = styled.h1`
  margin: 0;
  padding: 0;
  font-weight: 400;
  font-size: 20px;
`
const Buttons = styled.div`
  justify-self: flex-end;
`
const NavLink = styled(Link)`
  margin-left: 16px;
`
const StyledButton = styled(Button)`
  margin-left: 16px;
`

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
