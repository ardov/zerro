import React from 'react'
import { connect } from 'react-redux'
import { Box, Button, Link, Fade } from '@material-ui/core'
import { logIn } from 'logic/authorization'
import ZenApi from 'services/ZenApi'

ZenApi.checkCode()

function Auth(props) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <Fade in timeout={500}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={props.logIn}
          children="Войти через ДзенМани"
        />
      </Fade>

      <Fade in timeout={1000}>
        <Box mt={2} clone>
          <Link
            href="https://www.notion.so/ZERRO-a943f930d0a64d008712e20ecd299dbd"
            target="_blank"
            rel="noopener noreferrer"
            variant="body1"
            children="О проекте"
          />
        </Box>
      </Fade>
    </Box>
  )
}

const mapDispatchToProps = dispatch => ({
  logIn: () => dispatch(logIn()),
})

export default connect(
  null,
  mapDispatchToProps
)(Auth)
