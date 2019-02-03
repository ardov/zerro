import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'

import { Button } from 'antd'
import { logIn } from '../store/actions'
import ZenApi from '../services/ZenApi'

ZenApi.checkCode()

const Body = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
`

function Auth(props) {
  return (
    <Body>
      <Button type="primary" size="large" onClick={props.logIn}>
        Войти через ДзенМани
      </Button>
    </Body>
  )
}

const mapDispatchToProps = dispatch => {
  return {
    logIn: () => dispatch(logIn())
  }
}

export default connect(
  null,
  mapDispatchToProps
)(Auth)
