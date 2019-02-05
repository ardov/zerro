import { createAction } from 'redux-starter-kit'

export const addFakeTransaction = createAction('fakeTransactions/add')
export const removeFakeTransaction = createAction('fakeTransactions/remove')
