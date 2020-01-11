import React from 'react'
import { connect } from 'react-redux'
import { logOut } from 'logic/authorization'
import exportCsv from 'logic/exportCsv'
import exportJSON from 'logic/exportJSON'
import { toggle } from 'store/theme'
import { makeStyles } from '@material-ui/styles'
import SettingsIcon from '@material-ui/icons/Settings'
import SaveAltIcon from '@material-ui/icons/SaveAlt'
import InvertColorsIcon from '@material-ui/icons/InvertColors'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import {
  Box,
  Divider,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
} from '@material-ui/core'

const useStyles = makeStyles(({ spacing }) => ({
  menuIcon: { marginRight: spacing(1) },
}))

function MenuButton({ exportCsv, exportJSON, logOut, toggleTheme, ...rest }) {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const classes = useStyles()
  const localTheme = localStorage.getItem('theme')

  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const handleThemeChange = () => {
    handleClose()
    localStorage.setItem('theme', localTheme === 'dark' ? 'light' : 'dark')
    toggleTheme()
  }
  const setAutoTheme = () => {
    handleClose()
    localStorage.removeItem('theme')
  }

  return (
    <React.Fragment>
      <Tooltip title="Настройки">
        <IconButton onClick={handleClick} {...rest}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={exportCsv}>
          <SaveAltIcon className={classes.menuIcon} color="action" />
          Скачать CSV
        </MenuItem>
        <MenuItem onClick={exportJSON}>
          <SaveAltIcon className={classes.menuIcon} color="action" />
          Полный бэкап
        </MenuItem>
        <Box my={1}>
          <Divider light />
        </Box>
        <MenuItem onClick={handleThemeChange}>
          <InvertColorsIcon className={classes.menuIcon} color="action" />
          Изменить тему
        </MenuItem>
        {localTheme && (
          <MenuItem onClick={setAutoTheme}>
            <InvertColorsIcon className={classes.menuIcon} color="action" />
            Менять тему автоматически
          </MenuItem>
        )}
        <Box my={1}>
          <Divider light />
        </Box>
        <MenuItem onClick={logOut}>
          <ExitToAppIcon className={classes.menuIcon} color="action" />
          Выйти
        </MenuItem>
        <Box pl={6} pr={2} py={0.5}>
          <Typography variant="overline" color="textSecondary" align="center">
            0.1.4
          </Typography>
        </Box>
      </Menu>
    </React.Fragment>
  )
}

const mapDispatchToProps = dispatch => ({
  logOut: () => dispatch(logOut()),
  exportCsv: () => dispatch(exportCsv),
  exportJSON: () => dispatch(exportJSON),
  toggleTheme: () => dispatch(toggle()),
})

export default connect(null, mapDispatchToProps)(MenuButton)
