import React from 'react'
import { connect } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import { Snackbar, IconButton } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import { getMessage, removeMessage } from 'store/message'

const useStyles = makeStyles(theme => ({
  close: { padding: theme.spacing(0.5) },
}))

function Message({ text, removeMessage }) {
  const classes = useStyles()

  const handleClose = (e, reason) => {
    if (reason !== 'clickaway') removeMessage()
  }

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      open={!!text}
      autoHideDuration={3000}
      onClose={handleClose}
      ContentProps={{
        'aria-describedby': 'message-id',
      }}
      message={<span id="message-id">{text}</span>}
      action={[
        <IconButton
          key="close"
          aria-label="close"
          color="inherit"
          className={classes.close}
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>,
      ]}
    />
  )
}

export default connect(
  state => ({ text: getMessage(state) }),
  dispatch => ({ removeMessage: () => dispatch(removeMessage()) })
)(Message)
