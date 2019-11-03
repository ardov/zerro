import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import Drawer from 'components/DetailsDrawer/Drawer'
import decorator from 'helpers/storybookDecorator'

const transfer = {
  id: 'testId',
  date: Date.now(),
  changed: Date.now() - 20000000,
  created: Date.now() - 200000000,
  type: 'transfer',

  incomeAccountTitle: 'Income Account',
  outcomeAccountTitle: 'Outcome Account',
  deleted: true,
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
  date: Date.now(),
  changed: Date.now() - 20000000,
  created: Date.now() - 200000000,
  type: 'income',

  incomeAccountTitle: 'Income Account',
  outcomeAccountTitle: 'Outcome Account',
  deleted: true,
  // isOpened: false,
  // isInSelectionMode: false,
  // isChecked: false,
  payee: 'ООО "Работа"',
  tag: null,
  comment: 'Получил зарплату',
  qrCode:
    't=20190320T2303&s=5803.00&fn=9251440300007971&i=141637&fp=4087570038&n=1',

  income: 12500,
  incomeCurrency: 'RUB',
  opIncome: 300,
  opIncomeCurrency: 'USD',
  outcome: 13000,
  outcomeCurrency: 'RUB',
  opOutcome: null,
  opOutcomeCurrency: null,
  latitude: 60.0762313,
  longitude: 60.0762313,
}

export const actions = {
  onClose: action('onClose'),
  onChange: action('onChange'),
  onDelete: action('onDelete'),
  onRestore: action('onRestore'),
  onSelectSimilar: action('onSelectSimilar'),
}

storiesOf('TransactionDrawer', module)
  .addDecorator(decorator({ width: 400 }))
  .add('transfer', () => <Drawer {...transfer} {...actions} open={true} />)
  .add('income', () => <Drawer {...income} {...actions} open={true} />)
