import React from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'

import { Button } from 'antd'
import { logIn } from 'logic/authorization'
import ZenApi from 'services/ZenApi'

ZenApi.checkCode()

const Body = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
`

const LinkAbout = styled.a`
  margin-top: 16px;
  font-size: 16px;
`

function Auth(props) {
  return (
    <Body>
      <Button type="primary" size="large" onClick={props.logIn}>
        Войти через ДзенМани
      </Button>
      <LinkAbout
        href="https://www.notion.so/More-Money-ae7dee79e1b446dd81bf279e72eb6970"
        target="_blank"
        rel="noopener noreferrer"
      >
        О проекте
      </LinkAbout>
    </Body>
  )
}

const mapDispatchToProps = dispatch => ({
  logIn: () => dispatch(logIn()),
})

export default connect(
  null,
  mapDispatchToProps
)(Auth)
