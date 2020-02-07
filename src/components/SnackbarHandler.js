import React from 'react'
import { connect } from 'react-redux'
import { makeStyles } from '@material-ui/core/styles'
import { Snackbar, IconButton } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import { getMessage, removeMessage } from 'store/message'

const useStyles = makeStyles(theme => ({
  close: { padding: theme.spacing(0.5) },
  snackbar: {
    [theme.breakpoints.down('sm')]: { bottom: 64 },
  },
}))

function SnackbarHandler({ text, removeMessage, children }) {
  const classes = useStyles()

  const handleClose = (e, reason) => {
    if (reason !== 'clickaway') removeMessage()
  }

  return (
    <>
      {children}
      <Snackbar
        className={classes.snackbar}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        open={!!text}
        autoHideDuration={3000}
        onClose={handleClose}
        message={text}
        action={[
          <IconButton
            key="close"
            color="inherit"
            className={classes.close}
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>,
        ]}
      />
    </>
  )
}

export default connect(
  state => ({ text: getMessage(state) }),
  dispatch => ({ removeMessage: () => dispatch(removeMessage()) })
)(SnackbarHandler)
