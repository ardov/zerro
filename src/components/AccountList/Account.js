import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { formatMoney } from 'helpers/format'

const Body = styled.div`
  display: flex;
  flex-direction: row;
  min-width: 0;
  margin: 0 -8px;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background-color: var(--bg-hover);
    transition: all 0s;
  }
`
const Title = styled.div`
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`
const Amount = styled.div`
  flex-grow: 1;
  margin-left: 16px;
  text-align: right;
`

function Account(props) {
  const { title, balance, instrument, className } = props
  const formattedBalance = formatMoney(balance, instrument.shortTitle)
  return (
    <Body className={className} onClick={() => console.log(props)}>
      <Title title={title}>{title}</Title>
      <Amount>{formattedBalance}</Amount>
    </Body>
  )
}

const mapStateToProps = (state, props) => ({
  // ...getPopulatedAccount(state, props.id)
})

const mapDispatchToProps = (dispatch, props) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Account)
