import React from 'react'
import { connect } from 'react-redux'
import Account from './Account'
import styled, { css } from 'styled-components'
import {
  getInBalance,
  getOutOfBalance
} from '../../store/data/selectors/accounts'

const AccountList = props => (
  <div>
    <h3>В бюджете</h3>
    {props.inBalance.map(acc => (
      <Account key={acc.id} {...acc} />
    ))}
    <h3>Не в бюджете</h3>
    {props.outOfBalance.map(acc => (
      <Account key={acc.id} {...acc} />
    ))}
  </div>
)

const mapStateToProps = (state, props) => ({
  inBalance: getInBalance(state),
  outOfBalance: getOutOfBalance(state)
})

const mapDispatchToProps = (dispatch, props) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccountList)
