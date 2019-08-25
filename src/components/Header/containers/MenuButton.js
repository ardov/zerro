import React from 'react'
import { connect } from 'react-redux'
import { logOut } from 'logic/authorization'
import exportCsv from 'logic/exportCsv'
import exportJSON from 'logic/exportJSON'
import { makeStyles } from '@material-ui/styles'
import SettingsIcon from '@material-ui/icons/Settings'
import SaveAltIcon from '@material-ui/icons/SaveAlt'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import Divider from '@material-ui/core/Divider'

const useStyles = makeStyles({ menuIcon: { marginRight: 8 } })

function MenuButton({ exportCsv, exportJSON, logOut }) {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const classes = useStyles()

  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  return (
    <React.Fragment>
      <Tooltip title="Настройки">
        <IconButton onClick={handleClick}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={exportCsv}>
          <SaveAltIcon className={classes.menuIcon} />
          Скачать CSV
        </MenuItem>
        <MenuItem onClick={exportJSON}>
          <SaveAltIcon className={classes.menuIcon} />
          Полный бэкап
        </MenuItem>
        <Divider />
        <MenuItem onClick={logOut}>
          <ExitToAppIcon className={classes.menuIcon} />
          Выйти
        </MenuItem>
      </Menu>
    </React.Fragment>
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
