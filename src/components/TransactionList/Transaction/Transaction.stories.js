import React from 'react'
import { storiesOf, addDecorator } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import Transaction from './index'
import decorator from 'helpers/storybookDecorator'
import { List } from '@material-ui/core'

const transfer = {
  id: 'testId',
  changed: 0,
  type: 'transfer',

  incomeAccountTitle: 'Income Account',
  outcomeAccountTitle: 'Outcome Account',
  deleted: false,
  isOpened: false,
  isInSelectionMode: false,
  isChecked: false,
  payee: null,
  tag: null,
  comment: 'Test',

  income: 12500,
  incomeCurrency: 'RUB',
  opIncome: null,
  opIncomeCurrency: null,
  outcome: 13000,
  outcomeCurrency: 'RUB',
  opOutcome: null,
  opOutcomeCurrency: null,
}
const income = {
  id: 'testId',
  changed: 0,
  type: 'income',

  incomeAccountTitle: 'Income Account',
  outcomeAccountTitle: 'Outcome Account',
  deleted: true,
  isOpened: false,
  isInSelectionMode: false,
  isChecked: false,
  payee: null,
  tag: null,
  comment: 'Test',

  income: 12500,
  incomeCurrency: 'RUB',
  opIncome: 300,
  opIncomeCurrency: 'USD',
  outcome: 13000,
  outcomeCurrency: 'RUB',
  opOutcome: null,
  opOutcomeCurrency: null,
}

export const actions = {
  onToggle: action('onToggle'),
  onClick: action('onClick'),
  onFilterByPayee: action('onFilterByPayee'),
  onSelectChanged: action('onSelectChanged'),
}

storiesOf('Transaction', module)
  .addDecorator(decorator({ width: 400 }))
  .add('transfer', () => <Transaction {...transfer} {...actions} />)
  .add('income', () => <Transaction {...income} {...actions} />)
  .add('list', () => (
    <List>
      <Transaction {...transfer} {...actions} />
      <Transaction {...income} {...actions} />
      <Transaction {...income} isOpened {...actions} />
    </List>
  ))
