import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { formatMoney } from '../../Utils/format'

const Body = styled.div`
  display: flex;
  flex-direction: row;
  min-width: 0;
  padding: 8px;
  margin: 0 -8px;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    transition: all 0s;
  }
`
const Title = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`
const Amount = styled.div`
  text-align: right;
  margin-left: 16px;
  flex-grow: 1;
`

class Account extends React.Component {
  render() {
    const { title, balance, instrument } = this.props
    const formattedBalance = formatMoney(balance, instrument.shortTitle)
    return (
      <Body>
        <Title title={title}>{title}</Title>
        <Amount>{formattedBalance}</Amount>
      </Body>
    )
  }
}

const mapStateToProps = (state, props) => ({
  // ...getAccount(state, props.id)
})

const mapDispatchToProps = (dispatch, props) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Account)
