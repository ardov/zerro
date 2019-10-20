import React from 'react'
import { connect } from 'react-redux'
import InvertColorsIcon from '@material-ui/icons/InvertColors'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import { toggle } from 'store/theme'

const ThemeButton = ({ toggle, ...rest }) => {
  return (
    <Tooltip title="Переключить тему">
      <IconButton onClick={toggle} {...rest}>
        <InvertColorsIcon />
      </IconButton>
    </Tooltip>
  )
}

export default connect(
  null,
  dispatch => ({ toggle: () => dispatch(toggle()) })
)(ThemeButton)
