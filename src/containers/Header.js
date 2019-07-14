import React from 'react'
import { distanceInWordsToNow } from 'date-fns'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Button } from 'antd'
import { Menu, Dropdown, Icon } from 'antd'
import { logOut } from 'logic/authorization'
import exportCsv from 'logic/exportCsv'
import exportJSON from 'logic/exportJSON'
import { syncData } from 'logic/sync'
import { getChangedNum } from 'store/diff'
import { getLastSyncTime } from 'store/data/serverTimestamp'

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
  state,
  changedNum,
  lastSync,
}) {
  const exportMenu = (
    <Menu>
      <Menu.Item key="1" onClick={exportCsv}>
        <Icon type="download" />
        Скачать CSV
      </Menu.Item>
      <Menu.Item key="2" onClick={exportJSON}>
        <Icon type="download" />
        Полный бэкап
      </Menu.Item>
    </Menu>
  )
  return (
    <Main>
      <Name onClick={() => console.log(state)}>More Money Now</Name>
      <Name onClick={() => console.log(state)}>
        {distanceInWordsToNow(new Date(lastSync), { includeSeconds: true })}
      </Name>
      <div>
        <NavLink to="/transactions">Транзакции</NavLink>
        <NavLink to="/tags">Категории</NavLink>
        <NavLink to="/budget">Бюджет</NavLink>
      </div>
      <Buttons>
        <StyledButton
          icon="reload"
          onClick={syncData}
          type={changedNum ? 'primary' : ''}
        >
          {changedNum
            ? `Сохранить изменения (${changedNum})`
            : `Обновить данные`}
        </StyledButton>

        <Dropdown overlay={exportMenu}>
          <StyledButton onClick={exportJSON}>
            Экспорт <Icon type="down" />
          </StyledButton>
        </Dropdown>

        <StyledButton onClick={logOut}>Выйти</StyledButton>
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
    state,
    changedNum: getChangedNum(state),
    lastSync: getLastSyncTime(state),
  }),
  mapDispatchToProps
)(Header)
