import React, { FC } from 'react'
import { store } from 'store'
import { applyServerPatch } from 'store/data'
import { Providers } from '1-app/Providers'
import { getDemoData } from '../../demoData'

store.dispatch(applyServerPatch(getDemoData()))

export const DemoProviders: FC<{ children?: React.ReactNode }> = props => (
  <Providers store={store}>{props.children}</Providers>
)
