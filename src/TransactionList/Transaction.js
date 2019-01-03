import React from 'react'
// import { StoreContext } from './Store'

// {
//   id: '8ECFEAB7-17F2-40F5-8B9B-279D2A136732',
//   changed: 1488000309,
//   created: 1488000309,
//   user: 1,
//   deleted: false,
//   incomeInstrument: 2,
//   incomeAccount: '0593FEF0-2618-45EB-B8DA-6BCF3B660177',
//   income: 0,
//   outcomeInstrument: 2,
//   outcomeAccount: 'A85F1093-3886-4C99-823E-04E7202E5771',
//   outcome: 2000,
//   tag: null,
//   merchant: '202EC174-9C9D-42FE-BD55-A5D4F38D5E76',
//   payee: 'Паша',
//   originalPayee: null,
//   comment: 'Паша дал в долг до среды',
//   date: '2017-03-20',
//   mcc: null,
//   reminderMarker: null,
//   opIncome: null,
//   opIncomeInstrument: null,
//   opOutcome: null,
//   opOutcomeInstrument: null,
//   latitude: null,
//   longitude: null
// }

export default class Transaction extends React.Component {
  // static contextType = StoreContext
  render() {
    const { user, deleted, income, outcome, tag, payee, type } = this.props.data
    return (
      <div>
        User: {user.id} <br />
        {deleted ? 'удалена' : 'не удалена'} <br />
        {income && '+' + income} {outcome && '-' + outcome} <br />
        {type}
        <hr />
      </div>
    )
  }
}
