import { getDemoData } from 'stories/demoData'
import React, { FC } from 'react'
import { Provider } from 'react-redux'
import { store } from '../../store'
import { applyServerPatch } from '../../store/data'

store.dispatch(applyServerPatch(getDemoData()))

export const DemoStoreProvider: FC<{ children?: React.ReactNode }> = props => {
  return <Provider store={store}>{props.children}</Provider>
}
