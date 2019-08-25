import React from 'react'
import { connect } from 'react-redux'
import { Menu, Dropdown, Icon } from 'antd'
import { logOut } from 'logic/authorization'
import exportCsv from 'logic/exportCsv'
import exportJSON from 'logic/exportJSON'
import SettingsIcon from '@material-ui/icons/Settings'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'

function MenuButton({ exportCsv, exportJSON, logOut }) {
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
    <Dropdown overlay={SettingsMenu} trigger={['click']}>
      <Tooltip title="Настройки">
        <IconButton>
          <SettingsIcon />
        </IconButton>
      </Tooltip>
    </Dropdown>
  )
}

const mapDispatchToProps = dispatch => ({
  logOut: () => dispatch(logOut()),
  exportCsv: () => dispatch(exportCsv),
  exportJSON: () => dispatch(exportJSON),
})

export default connect(
  null,
  mapDispatchToProps
)(MenuButton)
