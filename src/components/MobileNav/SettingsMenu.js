import React from 'react'
import { connect } from 'react-redux'
import { logOut } from 'logic/authorization'
import { exportCSV } from 'logic/exportCSV'
import { exportJSON } from 'logic/exportJSON'
import { toggle } from 'store/theme'
import { makeStyles } from '@material-ui/styles'
import SaveAltIcon from '@material-ui/icons/SaveAlt'
import InvertColorsIcon from '@material-ui/icons/InvertColors'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder'
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'
import { Box, Divider, Menu, MenuItem, Typography } from '@material-ui/core'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'
import WhatshotIcon from '@material-ui/icons/Whatshot'

const useStyles = makeStyles(({ spacing }) => ({
  menuIcon: { marginRight: spacing(1) },
}))

function SettingsMenu({
  exportCSV,
  exportJSON,
  logOut,
  toggleTheme,
  onClose,
  anchorEl,
  open,
  ...rest
}) {
  const history = useHistory()
  const classes = useStyles()
  const localTheme = localStorage.getItem('theme')

  const handleThemeChange = () => {
    onClose()
    localStorage.setItem('theme', localTheme === 'dark' ? 'light' : 'dark')
    toggleTheme()
  }
  const setAutoTheme = () => {
    onClose()
    localStorage.removeItem('theme')
  }

  return (
    <Menu {...rest} {...{ onClose, anchorEl, open }}>
      <MenuItem onClick={exportCSV}>
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

      <MenuItem
        component="a"
        href="/about"
        onClick={e => {
          e.preventDefault()
          history.push('/about')
        }}
      >
        <HelpOutlineIcon className={classes.menuIcon} color="action" />
        Как пользоваться
      </MenuItem>

      <MenuItem component={Link} to="/donation">
        <FavoriteBorderIcon className={classes.menuIcon} color="action" />
        Поддержать проект
      </MenuItem>

      <MenuItem component={Link} to="/review">
        <WhatshotIcon className={classes.menuIcon} color="action" />
        <span className="red-gradient">Итоги года</span>
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
        <Typography
          variant="overline"
          color="textSecondary"
          align="center"
          onClick={() => window.location.reload(true)}
        >
          {process.env.REACT_APP_VERSION}
        </Typography>
      </Box>
    </Menu>
  )
}

const mapDispatchToProps = dispatch => ({
  logOut: () => dispatch(logOut()),
  exportCSV: () => dispatch(exportCSV),
  exportJSON: () => dispatch(exportJSON),
  toggleTheme: () => dispatch(toggle()),
})

export default connect(null, mapDispatchToProps)(SettingsMenu)
