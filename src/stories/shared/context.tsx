import React from 'react'
import { DemoProviders } from './DemoProviders'

export const context = (Story: any) => (
  <DemoProviders>
    <Story />
  </DemoProviders>
)
