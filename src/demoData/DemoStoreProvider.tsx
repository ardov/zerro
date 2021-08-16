import { getDemoData } from 'demoData'
import React, { FC } from 'react'
import { Provider } from 'react-redux'
import { store } from '../store'
import { applyServerPatch } from '../store/data'

store.dispatch(applyServerPatch(getDemoData()))

export const DemoStoreProvider: FC<{}> = props => {
  return <Provider store={store}>{props.children}</Provider>
}
