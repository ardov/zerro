import React, { Component } from 'react'
import styled from 'styled-components'
import { StoreContext } from '../store'

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

export default class Auth extends Component {
  static contextType = StoreContext

  logIn = () => {
    this.context.dispatch(logIn())
  }

  render() {
    return (
      <Body>
        <Button type="primary" size="large" onClick={this.logIn}>
          Войти через ДзенМани
        </Button>
      </Body>
    )
  }
}
