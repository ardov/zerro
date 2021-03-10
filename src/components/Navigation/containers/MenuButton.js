import React from 'react'
import { connect } from 'react-redux'
import { logOut } from 'logic/authorization'
import { exportCSV } from 'logic/exportCSV'
import { exportJSON } from 'logic/exportJSON'
import { makeStyles } from '@material-ui/styles'
import SettingsIcon from '@material-ui/icons/Settings'
import SaveAltIcon from '@material-ui/icons/SaveAlt'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import {
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@material-ui/core'
import { Tooltip } from 'components/Tooltip'
import WbSunnyIcon from '@material-ui/icons/WbSunny'
import NightsStayIcon from '@material-ui/icons/NightsStay'
import { useThemeType } from 'helpers/useThemeType'

const useStyles = makeStyles(({ spacing }) => ({
  menuIcon: { marginRight: spacing(1) },
}))

function MenuButton({ exportCSV, exportJSON, logOut, ...rest }) {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const classes = useStyles()
  const theme = useThemeType()

  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const handleThemeChange = () => {
    handleClose()
    theme.toggle()
  }

  return (
    <React.Fragment>
      <Tooltip title="Настройки">
        <IconButton onClick={handleClick} {...rest}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
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

        <MenuItem onClick={handleThemeChange}>
          {theme.type === 'dark' ? (
            <>
              <WbSunnyIcon className={classes.menuIcon} color="action" />
              Светлая тема
            </>
          ) : (
            <>
              <NightsStayIcon className={classes.menuIcon} color="action" />
              Тёмная тема
            </>
          )}
        </MenuItem>

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
    </React.Fragment>
  )
}

const mapDispatchToProps = dispatch => ({
  logOut: () => dispatch(logOut()),
  exportCSV: () => dispatch(exportCSV),
  exportJSON: () => dispatch(exportJSON),
})

export default connect(null, mapDispatchToProps)(MenuButton)
