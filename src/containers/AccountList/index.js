import React from 'react'
import { connect } from 'react-redux'
import Account from './Account'
import styled from 'styled-components'
import { getInBalance, getOutOfBalance } from 'store/data/accounts'
import { getUserInstrument } from 'store/data/users'

const Heading = styled(Account)`
  margin-top: 16px;
  font-weight: 700;
  font-size: 14px;
`

const getTotalBalance = (accs, targetInstrument) =>
  accs.reduce((sum, acc) => {
    const balance = acc.balance
    const accRate = acc.instrument.rate
    const targetRate = targetInstrument.rate
    return +(sum += (balance * accRate) / targetRate).toFixed(2)
  }, 0)

const AccountList = ({
  inBalance,
  outOfBalance,
  userInstrument,
  className,
}) => {
  if (!userInstrument) return null

  const inBalanceSum = getTotalBalance(inBalance, userInstrument)
  const outOfBalanceSum = getTotalBalance(outOfBalance, userInstrument)

  return (
    <div className={className}>
      <Heading
        title="В бюджете"
        balance={inBalanceSum}
        instrument={userInstrument}
      />
      {inBalance.map(acc => (
        <Account key={acc.id} {...acc} />
      ))}

      <Heading
        title="Не в бюджете"
        balance={outOfBalanceSum}
        instrument={userInstrument}
      />
      {outOfBalance.map(acc => (
        <Account key={acc.id} {...acc} />
      ))}
    </div>
  )
}

const mapStateToProps = (state, props) => ({
  inBalance: getInBalance(state),
  outOfBalance: getOutOfBalance(state),
  userInstrument: getUserInstrument(state),
})

const mapDispatchToProps = (dispatch, props) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccountList)
