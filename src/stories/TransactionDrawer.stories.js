import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import Drawer from 'components/DetailsDrawer/Drawer'
import decorator from 'helpers/storybookDecorator'

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
  qrCode:
    't=20190320T2303&s=5803.00&fn=9251440300007971&i=141637&fp=4087570038&n=1',

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
  onClose: action('onClose'),
}

storiesOf('TransactionDrawer', module)
  .addDecorator(decorator({ width: 400 }))
  .add('transfer', () => <Drawer {...transfer} {...actions} open={true} />)
  .add('income', () => <Drawer {...income} {...actions} open={true} />)
